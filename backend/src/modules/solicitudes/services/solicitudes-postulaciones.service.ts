import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoSolicitud, Solicitud } from '../entities/solicitud.entity';
import { EstadoPostulacion, PostulacionSolicitud } from '../entities/postulacion-solicitud.entity';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';
import { SolicitudesConsultaService } from './solicitudes-consulta.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';

@Injectable()
export class SolicitudesPostulacionesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(PostulacionSolicitud)
    private readonly postulacionesRepository: Repository<PostulacionSolicitud>,
    private readonly dataSource: DataSource,
    private readonly consultasService: SolicitudesConsultaService,
    private readonly notificacionesService: SolicitudesNotificacionesService,
  ) {}

  async postular(id: string, dto: CrearPostulacionDto, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud || solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('La oferta ya no está activa');
    }
    if (solicitud.fecha_expiracion_oferta && solicitud.fecha_expiracion_oferta.getTime() <= Date.now()) {
      await this.solicitudesRepository.update(id, { estado: EstadoSolicitud.EXPIRADA });
      throw new BadRequestException('La oferta ya expiró');
    }
    if (solicitud.cliente_id === user.id) {
      throw new BadRequestException('No puedes postularte a tu propia oferta');
    }
    const existente = await this.postulacionesRepository.findOneBy({ solicitud_id: id, tecnico_id: user.id });
    if (existente) {
      throw new BadRequestException('Ya enviaste una postulación para esta oferta');
    }
    const postulacion = await this.postulacionesRepository.save({
      solicitud_id: id,
      tecnico_id: user.id,
      unidad_cobro: dto.unidad_cobro,
      precio: dto.precio,
      mensaje: dto.mensaje?.trim() || null,
      estado: EstadoPostulacion.PENDIENTE,
    });
    const vista = await this.consultasService.detalle(id, {
      id: solicitud.cliente_id,
      rol: RolUsuario.CLIENTE,
    } as AuthenticatedUser);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      { ...vista, postulacion },
      'Nueva postulación',
      'Un técnico ha enviado una propuesta para tu oferta.',
      '/solicitudes',
    );
    return postulacion;
  }

  async aceptarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud || solicitud.cliente_id !== user.id) throw new NotFoundException('Solicitud no encontrada');
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'La oferta ya no está activa');
    const postulacion = await this.postulacionesRepository.findOneBy({ id: postulacionId, solicitud_id: id });
    if (!postulacion || postulacion.estado !== EstadoPostulacion.PENDIENTE) {
      throw new NotFoundException('Postulación no disponible');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Solicitud).update(id, {
        estado: EstadoSolicitud.ACEPTADA,
        tecnico_id: postulacion.tecnico_id,
        fecha_aceptacion: new Date(),
        fecha_expiracion_oferta: null,
      });
      await manager.getRepository(PostulacionSolicitud).update(
        { solicitud_id: id, id: postulacionId },
        { estado: EstadoPostulacion.ACEPTADA },
      );
      await manager.getRepository(PostulacionSolicitud).update(
        { solicitud_id: id, estado: EstadoPostulacion.PENDIENTE },
        { estado: EstadoPostulacion.RECHAZADA },
      );
    });
    const vista = await this.consultasService.detalle(id, user);
    await this.notificacionesService.actualizada(
      postulacion.tecnico_id,
      vista,
      'Postulación aceptada',
      'El cliente aceptó tu propuesta.',
      '/solicitudes/recibidas',
    );
    return vista;
  }

  async rechazarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud || solicitud.cliente_id !== user.id) throw new NotFoundException('Solicitud no encontrada');
    const postulacion = await this.postulacionesRepository.findOneBy({ id: postulacionId, solicitud_id: id });
    if (!postulacion || postulacion.estado !== EstadoPostulacion.PENDIENTE) {
      throw new NotFoundException('Postulación no disponible');
    }
    await this.postulacionesRepository.update(postulacionId, { estado: EstadoPostulacion.RECHAZADA });
    return { ok: true };
  }

  private verEstado(solicitud: Solicitud, permitidos: EstadoSolicitud[], mensaje: string) {
    if (!permitidos.includes(solicitud.estado)) {
      throw new BadRequestException(mensaje);
    }
  }
}
