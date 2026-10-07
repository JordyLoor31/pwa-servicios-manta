import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { Usuario, RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { AceptarSolicitudDto } from '../dtos/aceptar-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import { CrearPostulacionDto } from '../dtos/crear-postulacion.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SolicitudesDisponibilidadService } from './solicitudes-disponibilidad.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';
import { SolicitudesConsultaService, type FiltrosSolicitudes } from './solicitudes-consulta.service';
import { SolicitudesPostulacionesService } from './solicitudes-postulaciones.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(SolicitudCategoria)
    private readonly solicitudCategoriasRepository: Repository<SolicitudCategoria>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    private readonly disponibilidadService: SolicitudesDisponibilidadService,
    private readonly notificacionesService: SolicitudesNotificacionesService,
    private readonly consultasService: SolicitudesConsultaService,
    private readonly postulacionesService: SolicitudesPostulacionesService,
  ) {}

  async crear(clienteId: string, dto: CrearSolicitudDto) {
    if (dto.tecnico_id) {
      if (clienteId === dto.tecnico_id) {
        throw new BadRequestException('No puedes solicitar un servicio a tu propio perfil');
      }
      const tecnico = await this.usuariosRepository.findOneBy({ id: dto.tecnico_id });
      if (!tecnico) {
        throw new NotFoundException('El tǸcnico seleccionado no existe');
      }
      if (tecnico.rol !== RolUsuario.TECNICO) {
        throw new BadRequestException('El usuario seleccionado no es un tǸcnico');
      }
      const perfil = await this.perfilesRepository.findOneBy({ usuario_id: dto.tecnico_id });
      if (!perfil) {
        throw new BadRequestException('El tǸcnico aǧn no ha completado su perfil');
      }
    }
    const solicitud = await this.solicitudesRepository.save({
      cliente_id: clienteId,
      tecnico_id: dto.tecnico_id ?? null,
      descripcion: dto.descripcion.trim(),
      direccion: dto.direccion?.trim() || null,
      direccion_latitud: dto.direccion_latitud ?? null,
      direccion_longitud: dto.direccion_longitud ?? null,
      fecha_propuesta: dto.fecha_propuesta || null,
      hora_propuesta: dto.hora_propuesta || null,
      estado: EstadoSolicitud.PENDIENTE,
      duracion_oferta_minutos: dto.tecnico_id ? null : (dto.duracion_oferta_minutos ?? 30),
      fecha_expiracion_oferta: dto.tecnico_id
        ? null
        : new Date(Date.now() + (dto.duracion_oferta_minutos ?? 30) * 60_000),
    });
    if (dto.categoria_ids.length > 0) {
      await this.solicitudCategoriasRepository.insert(
        dto.categoria_ids.map((categoria_id) => ({ solicitud_id: solicitud.id, categoria_id })),
      );
    }
    const vista = await this.detalle(solicitud.id, {
      id: clienteId,
      rol: RolUsuario.CLIENTE,
    } as AuthenticatedUser);
    const dia = dto.fecha_propuesta
      ? new Date(`${dto.fecha_propuesta}T12:00:00`).getDay()
      : new Date().getDay();
    const tecnicosDisponibles = await this.usuariosRepository
      .createQueryBuilder('u')
      .innerJoin(PerfilTecnico, 'p', 'p.usuario_id = u.id')
      .innerJoin(
        DisponibilidadTecnico,
        'd',
        'd.tecnico_id = u.id AND d.dia_semana = :dia',
        { dia },
      )
      .where('u.rol = :rol', { rol: RolUsuario.TECNICO })
      .andWhere('u.estado = :estado', { estado: EstadoUsuario.ACTIVO })
      .select('u.id AS id')
      .distinct(true)
      .getRawMany<{ id: string }>();
    await Promise.all(
      tecnicosDisponibles.map((tecnico) => this.notificacionesService.nueva(tecnico.id, vista)),
    );
    if (dto.tecnico_id && !tecnicosDisponibles.some((t) => t.id === dto.tecnico_id)) {
      await this.notificacionesService.nueva(dto.tecnico_id, vista);
    }

    return vista;
  }

  async listarPostulaciones(id: string, user: AuthenticatedUser) {
    return this.consultasService.listarPostulaciones(id, user);
  }

  async postular(id: string, dto: CrearPostulacionDto, user: AuthenticatedUser) {
    return this.postulacionesService.postular(id, dto, user);
  }

  async aceptarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    return this.postulacionesService.aceptarPostulacion(id, postulacionId, user);
  }

  async rechazarPostulacion(id: string, postulacionId: string, user: AuthenticatedUser) {
    return this.postulacionesService.rechazarPostulacion(id, postulacionId, user);
  }

  async listarMis(clienteId: string, filtros: FiltrosSolicitudes) {
    return this.consultasService.listarMis(clienteId, filtros);
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosSolicitudes) {
    return this.consultasService.listarRecibidas(tecnicoId, filtros);
  }

  async listarAdmin(filtros: FiltrosSolicitudes) {
    return this.consultasService.listarAdmin(filtros);
  }

  async detalle(id: string, user: AuthenticatedUser) {
    return this.consultasService.detalle(id, user);
  }

  async aceptar(id: string, dto: AceptarSolicitudDto, user: AuthenticatedUser) {
    void id;
    void dto;
    void user;
    throw new BadRequestException(
      'Debes enviar una postulación; el cliente debe elegir tu propuesta',
    );
  }

  async rechazar(id: string, dto: RechazarSolicitudDto, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede rechazar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'Solo se puede rechazar una solicitud pendiente');
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.RECHAZADA,
      motivo_rechazo: dto.motivo_rechazo.trim(),
    });
    await this.disponibilidadService.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Solicitud rechazada',
      `${this.nombreUsuario(vista, 'tecnico') || 'El técnico'} ${this.apellidoUsuario(vista, 'tecnico')} rechazó tu solicitud.`,
      '/solicitudes',
    );
    return vista;
  }

  async cancelar(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.cliente_id === user.id,
      'Solo el cliente solicitante puede cancelar la solicitud',
    );
    this.verEstado(
      solicitud,
      [EstadoSolicitud.PENDIENTE, EstadoSolicitud.ACEPTADA],
      'Solo se puede cancelar una solicitud pendiente o aceptada',
    );
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.CANCELADA,
    });
    await this.disponibilidadService.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    if (solicitud.tecnico_id) {
      await this.notificacionesService.actualizada(
        solicitud.tecnico_id,
        vista,
        'Solicitud cancelada',
        `${this.nombreUsuario(vista, 'cliente')} ${this.apellidoUsuario(vista, 'cliente')} canceló la solicitud.`,
        '/solicitudes/recibidas',
      );
    }
    return vista;
  }

  async completar(id: string, user: AuthenticatedUser) {
    return this.iniciarCompletacion(id, user);
  }

  private generarCodigo(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async iniciarCompletacion(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede completar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.ACEPTADA], 'Solo se puede completar una solicitud aceptada');

    const codigo = this.generarCodigo();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    await this.solicitudesRepository.update(solicitud.id, {
      codigo_completacion: codigo,
      fecha_expiracion_codigo: expiracion,
      codigo_fallido: false,
    });

    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Código de confirmación',
      `Tu técnico ha finalizado el trabajo. Código de confirmación: ${codigo} (válido 10 min).`,
      '/solicitudes',
    );

    return { ok: true, expiracion: expiracion.toISOString() };
  }

  async confirmarCompletacion(id: string, codigo: string | undefined, user: AuthenticatedUser) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.tecnico_id !== user.id) {
      throw new ForbiddenException('Solo el técnico asignado puede confirmar la completación');
    }
    if (solicitud.estado !== EstadoSolicitud.ACEPTADA) {
      throw new BadRequestException('La solicitud no está en estado aceptada');
    }
    const codigoNormalizado = typeof codigo === 'string' ? codigo.trim() : '';
    if (!/^\d{4}$/.test(codigoNormalizado)) {
      throw new BadRequestException('Debes ingresar un código válido de 4 dígitos');
    }
    if (!solicitud.codigo_completacion || !solicitud.fecha_expiracion_codigo) {
      throw new BadRequestException('No hay código de completación pendiente');
    }
    if (solicitud.fecha_expiracion_codigo.getTime() <= Date.now()) {
      await this.solicitudesRepository.update(solicitud.id, {
        codigo_completacion: null,
        fecha_expiracion_codigo: null,
      });
      throw new BadRequestException('El código ha expirado');
    }
    if (solicitud.codigo_completacion !== codigoNormalizado) {
      await this.solicitudesRepository.update(solicitud.id, {
        codigo_fallido: true,
      });
      throw new BadRequestException('Código incorrecto. Verifica el código entregado por el cliente.');
    }

    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.COMPLETADA,
      fecha_completada: new Date(),
      codigo_completacion: null,
      fecha_expiracion_codigo: null,
      codigo_fallido: false,
    });
    if (solicitud.tecnico_id) {
      await this.perfilesRepository.increment(
        { usuario_id: solicitud.tecnico_id },
        'total_servicios_completados',
        1,
      );
    }
    await this.disponibilidadService.liberarReserva(solicitud.id);

    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Servicio confirmado',
      'El técnico confirmó la completación del servicio con el código recibido.',
      '/solicitudes',
    );
    return vista;
  }

  private async obtenerParaAccion(
    id: string,
    user: AuthenticatedUser,
    acceder: (solicitud: Solicitud) => boolean,
    mensaje: string,
  ) {
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (user.rol !== RolUsuario.ADMIN && !acceder(solicitud)) {
      throw new ForbiddenException(mensaje);
    }
    return solicitud;
  }

  private verEstado(solicitud: Solicitud, permitidos: EstadoSolicitud[], mensaje: string) {
    if (!permitidos.includes(solicitud.estado)) {
      throw new BadRequestException(mensaje);
    }
  }

  private nombreUsuario(vista: Record<string, unknown>, tipo: 'cliente' | 'tecnico') {
    const usuario = vista[tipo];
    if (!usuario || typeof usuario !== 'object') return '';
    const nombre = (usuario as Record<string, unknown>).nombres;
    return typeof nombre === 'string' ? nombre : '';
  }

  private apellidoUsuario(vista: Record<string, unknown>, tipo: 'cliente' | 'tecnico') {
    const usuario = vista[tipo];
    if (!usuario || typeof usuario !== 'object') return '';
    const apellido = (usuario as Record<string, unknown>).apellidos;
    return typeof apellido === 'string' ? apellido : '';
  }

}
