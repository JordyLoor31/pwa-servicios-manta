import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EstadoSolicitud, Solicitud } from '../entities/solicitud.entity';
import { EstadoPostulacion, PostulacionSolicitud } from '../entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { Direccion } from '../../direcciones/entities/direccion.entity';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';
import { calcularDistanciaKm } from '../utils/geo';
import { SolicitudesConsultaService } from './solicitudes-consulta.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';

@Injectable()
export class SolicitudesPostulacionesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(PostulacionSolicitud)
    private readonly postulacionesRepository: Repository<PostulacionSolicitud>,
    @InjectRepository(SolicitudCategoria)
    private readonly solicitudCategoriasRepository: Repository<SolicitudCategoria>,
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(Direccion)
    private readonly direccionesRepository: Repository<Direccion>,
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
    await this.asegurarCobertura(solicitud, user.id);
    const tarifa = await this.obtenerTarifaPerfil(id, user.id, dto.tarifa_id);
    const postulacion = await this.postulacionesRepository.save({
      solicitud_id: id,
      tecnico_id: user.id,
      unidad_cobro: tarifa.unidad_cobro,
      precio: tarifa.precio,
      tipo_servicio: tarifa.tipo_servicio,
      categoria_id: tarifa.categoria_id,
      negociable: tarifa.negociable,
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

  private async asegurarCobertura(solicitud: Solicitud, tecnicoId: string) {
    const perfil = await this.perfilesRepository.findOneBy({ usuario_id: tecnicoId });
    const radioCoberturaKm = perfil?.radio_cobertura_km ?? null;
    if (radioCoberturaKm == null) return;

    const direccion = await this.direccionesRepository.findOne({
      where: { usuario_id: tecnicoId, es_principal: true },
    });
    if (!direccion) return;

    const distanciaKm = calcularDistanciaKm(
      solicitud.direccion_latitud,
      solicitud.direccion_longitud,
      direccion.latitud,
      direccion.longitud,
    );
    if (distanciaKm == null || distanciaKm <= radioCoberturaKm) return;

    throw new BadRequestException(
      `La ubicación del cliente está a ${distanciaKm.toFixed(2)} km de tu dirección y supera tu radio de cobertura de ${radioCoberturaKm} km.`,
    );
  }

  private async obtenerTarifaPerfil(solicitudId: string, tecnicoId: string, tarifaId?: string) {
    const categorias = await this.solicitudCategoriasRepository
      .createQueryBuilder('sc')
      .innerJoin('categorias_servicio', 'categoria', 'categoria.id = sc.categoria_id')
      .select(['sc.categoria_id AS categoria_id'])
      .where('sc.solicitud_id = :solicitudId', { solicitudId })
      .orderBy('categoria.nombre', 'ASC')
      .getRawMany<{ categoria_id: string }>();

    if (categorias.length === 0) {
      throw new BadRequestException('La oferta no tiene categorías asociadas');
    }

    const tarifas = await this.tarifasRepository.find({
      where: {
        tecnico_id: tecnicoId,
        categoria_id: In(categorias.map((categoria) => categoria.categoria_id)),
      },
    });
    if (tarifaId) {
      const tarifa = tarifas.find((actual) => actual.id === tarifaId);
      if (!tarifa) {
        throw new BadRequestException(
          'La tarifa seleccionada no corresponde a una categoría de esta oferta',
        );
      }
      return tarifa;
    }
    let tarifa: TarifaTecnico | undefined;
    for (const categoria of categorias) {
      tarifa = tarifas.find((actual) => actual.categoria_id === categoria.categoria_id);
      if (tarifa) break;
    }

    if (!tarifa) {
      throw new BadRequestException(
        'No tienes una tarifa configurada para las categorías de esta oferta. Actualiza tus categorías y tarifas en tu perfil.',
      );
    }

    return tarifa;
  }

  private verEstado(solicitud: Solicitud, permitidos: EstadoSolicitud[], mensaje: string) {
    if (!permitidos.includes(solicitud.estado)) {
      throw new BadRequestException(mensaje);
    }
  }
}
