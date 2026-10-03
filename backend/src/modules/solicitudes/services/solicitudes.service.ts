import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import { ReservaServicio } from '../entities/reserva-servicio.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';

import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { Usuario, RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { AceptarSolicitudDto } from '../dtos/aceptar-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { NotificacionesGateway } from '../../notificaciones/notificaciones.gateway';
import { NotificacionesPushService } from '../../notificaciones-push/services/notificaciones-push.service';

interface FiltrosPaginados {
  page: number;
  limit: number;
  estado?: string;
}

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    @InjectRepository(ReservaServicio)
    private readonly reservasRepository: Repository<ReservaServicio>,
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
    private readonly notificaciones: NotificacionesGateway,
    private readonly notificacionesPush: NotificacionesPushService,
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
      fecha_propuesta: dto.fecha_propuesta || null,
      hora_propuesta: dto.hora_propuesta || null,
      estado: EstadoSolicitud.PENDIENTE,
    });
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
    for (const tecnico of tecnicosDisponibles) {
      this.notificaciones.notificarNuevaSolicitud(tecnico.id, {
        evento: 'solicitud.nueva',
        solicitud: vista,
      });
      await this.notificacionesPush.enviar(tecnico.id, {
        titulo: 'Nueva solicitud de servicio',
        cuerpo: `${vista.cliente.nombres} ${vista.cliente.apellidos} quiere un servicio.`,
        url: '/solicitudes/recibidas',
      });
    }
    if (dto.tecnico_id && !tecnicosDisponibles.some((t) => t.id === dto.tecnico_id)) {
      this.notificaciones.notificarNuevaSolicitud(dto.tecnico_id, {
        evento: 'solicitud.nueva',
        solicitud: vista,
      });
      await this.notificacionesPush.enviar(dto.tecnico_id, {
        titulo: 'Nueva solicitud de servicio',
        cuerpo: `${vista.cliente.nombres} ${vista.cliente.apellidos} quiere un servicio.`,
        url: '/solicitudes/recibidas',
      });
    }
    return vista;
  }

  async listarMis(clienteId: string, filtros: FiltrosPaginados) {
    return this.listarConJoin(
      filtros,
      's.cliente_id = :cliente_id',
      { cliente_id: clienteId },
    );
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosPaginados) {
    return this.listarConJoin(
      filtros,
      '(s.tecnico_id = :tecnico_id OR s.tecnico_id IS NULL)',
      { tecnico_id: tecnicoId },
    );
  }

  async listarAdmin(filtros: FiltrosPaginados) {
    return this.listarConJoin(filtros);
  }

  private async listarConJoin(
    filtros: FiltrosPaginados,
    condicionSql?: string,
    params?: Record<string, unknown>,
  ) {
    const qb = this.solicitudesRepository
      .createQueryBuilder('s')
      .innerJoin(Usuario, 'cli', 'cli.id = s.cliente_id')
      .leftJoin(Usuario, 'tec', 'tec.id = s.tecnico_id')
      .select(this.columnasBase());
    if (condicionSql) {
      qb.andWhere(condicionSql, params);
    }
    if (filtros.estado) {
      qb.andWhere('s.estado = :estado', { estado: filtros.estado });
    }
    const total = await qb.getCount();
    const filas = await qb
      .orderBy('s.fecha_solicitud', 'DESC')
      .skip((filtros.page - 1) * filtros.limit)
      .take(filtros.limit)
      .getRawMany();
    return {
      data: await Promise.all(filas.map((fila) => this.toView(fila))),
      total,
      page: filtros.page,
      limit: filtros.limit,
    };
  }

  async detalle(id: string, user: AuthenticatedUser) {
    const fila = await this.buscarFila(id);
    if (!fila) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    this.asegurarAcceso(fila, user);
    return await this.toView(fila);
  }

  async aceptar(id: string, dto: AceptarSolicitudDto, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id || s.tecnico_id === null,
      'Solo el tǸcnico destinatario puede aceptar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'Solo se puede aceptar una solicitud pendiente');

    const horaInicio = dto.hora_inicio;
    const horaFin = this.sumarHoras(horaInicio, dto.duracion_horas);
    this.validarFechaServicio(dto.fecha_servicio);
    const tecnicoId = solicitud.tecnico_id ?? user.id;
    await this.validarEnDisponibilidad(tecnicoId, dto.fecha_servicio, horaInicio, horaFin);
    await this.validarSinSolapamiento(tecnicoId, dto.fecha_servicio, horaInicio, horaFin);

    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.ACEPTADA,
      fecha_aceptacion: new Date(),
      fecha_propuesta: dto.fecha_servicio,
      hora_propuesta: horaInicio,
      hora_fin_estimada: horaFin,
      tecnico_id: tecnicoId,
    });
    await this.reservasRepository.save({
      tecnico_id: tecnicoId,
      solicitud_id: solicitud.id,
      fecha_servicio: dto.fecha_servicio,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });
    const vista = await this.detalle(id, user);
    this.notificaciones.notificarSolicitudActualizada(solicitud.cliente_id, {
      evento: 'solicitud.actualizada',
      solicitud: vista,
    });
    await this.notificacionesPush.enviar(solicitud.cliente_id, {
      titulo: 'Solicitud aceptada',
      cuerpo: `${vista.tecnico.nombres} ${vista.tecnico.apellidos} aceptó tu solicitud para el ${dto.fecha_servicio} a las ${horaInicio}.`,
      url: '/solicitudes',
    });
    return vista;
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
    await this.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    this.notificaciones.notificarSolicitudActualizada(solicitud.cliente_id, {
      evento: 'solicitud.actualizada',
      solicitud: vista,
    });
    await this.notificacionesPush.enviar(solicitud.cliente_id, {
      titulo: 'Solicitud rechazada',
      cuerpo: `${vista.tecnico.nombres} ${vista.tecnico.apellidos} rechazó tu solicitud.`,
      url: '/solicitudes',
    });
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
    await this.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    if (solicitud.tecnico_id) {
      this.notificaciones.notificarSolicitudActualizada(solicitud.tecnico_id, {
        evento: 'solicitud.actualizada',
        solicitud: vista,
      });
      await this.notificacionesPush.enviar(solicitud.tecnico_id, {
        titulo: 'Solicitud cancelada',
        cuerpo: `${vista.cliente.nombres} ${vista.cliente.apellidos} cancel�� la solicitud.`,
        url: '/solicitudes/recibidas',
      });
    }
    return vista;
  }

  async completar(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede completar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.ACEPTADA], 'Solo se puede completar una solicitud aceptada');
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.COMPLETADA,
      fecha_completada: new Date(),
    });
    if (solicitud.tecnico_id) {
      await this.perfilesRepository.increment(
        { usuario_id: solicitud.tecnico_id },
        'total_servicios_completados',
        1,
      );
    }
    await this.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    this.notificaciones.notificarSolicitudActualizada(solicitud.cliente_id, {
      evento: 'solicitud.actualizada',
      solicitud: vista,
    });
    await this.notificacionesPush.enviar(solicitud.cliente_id, {
      titulo: 'Servicio completado',
      cuerpo: `${vista.tecnico.nombres} ${vista.tecnico.apellidos} completó tu servicio.`,
      url: '/solicitudes',
    });
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

  private sumarHoras(hora: string, horas: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h + horas;
    return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private validarFechaServicio(fecha: string) {
    const hoy = new Date();
    const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
      hoy.getDate(),
    ).padStart(2, '0')}`;
    if (fecha < hoyTexto) {
      throw new BadRequestException('La fecha del servicio no puede ser anterior a hoy');
    }
  }

  private async validarEnDisponibilidad(
    tecnicoId: string,
    fecha: string,
    inicio: string,
    fin: string,
  ) {
    const dia = new Date(`${fecha}T12:00:00`).getDay();
    const filas = await this.disponibilidadRepository.find({
      where: { tecnico_id: tecnicoId, dia_semana: dia },
    });
    const dentro = filas.some(
      (fila) =>
        this.minutos(fila.hora_inicio) <= this.minutos(inicio) &&
        this.minutos(fila.hora_fin) >= this.minutos(fin),
    );
    if (!dentro) {
      throw new BadRequestException(
        'El horario elegido supera la disponibilidad semanal del técnico para ese día',
      );
    }
  }

  private async validarSinSolapamiento(
    tecnicoId: string,
    fecha: string,
    inicio: string,
    fin: string,
  ) {
    const solapada = await this.reservasRepository
      .createQueryBuilder('r')
      .where('r.tecnico_id = :tecnicoId', { tecnicoId })
      .andWhere('r.fecha_servicio = :fecha', { fecha })
      .andWhere('this.minutos(r.hora_inicio) < :fin', { fin: this.minutos(fin) })
      .andWhere('this.minutos(r.hora_fin) > :inicio', { inicio: this.minutos(inicio) })
      .getExists();
    if (solapada) {
      throw new ConflictException('El técnico ya tiene un servicio reservado en ese horario');
    }
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m ?? 0);
  }

  private async liberarReserva(solicitudId: string) {
    await this.reservasRepository.delete({ solicitud_id: solicitudId });
  }

  private asegurarAcceso(
    fila: { cliente_id: string; tecnico_id: string },
    user: AuthenticatedUser,
  ) {
    if (
      user.rol !== RolUsuario.ADMIN &&
      user.id !== fila.cliente_id &&
      user.id !== fila.tecnico_id
    ) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }
  }

  private async buscarFila(id: string) {
    return this.solicitudesRepository
      .createQueryBuilder('s')
      .innerJoin(Usuario, 'cli', 'cli.id = s.cliente_id')
      .leftJoin(Usuario, 'tec', 'tec.id = s.tecnico_id')
      .select(this.columnasBase())
      .where('s.id = :id', { id })
      .getRawOne();
  }

  private columnasBase() {
    return [
      's.id AS id',
      's.estado AS estado',
      's.descripcion AS descripcion',
      's.direccion AS direccion',
      's.motivo_rechazo AS motivo_rechazo',
      's.fecha_propuesta AS fecha_propuesta',
      's.hora_propuesta AS hora_propuesta',
      's.hora_fin_estimada AS hora_fin_estimada',
      's.fecha_solicitud AS fecha_solicitud',
      's.fecha_aceptacion AS fecha_aceptacion',
      's.fecha_completada AS fecha_completada',
      'cli.id AS cliente_id',
      'cli.nombres AS cliente_nombres',
      'cli.apellidos AS cliente_apellidos',
      'tec.id AS tecnico_id',
      'tec.nombres AS tecnico_nombres',
      'tec.apellidos AS tecnico_apellidos',
    ];
  }

  private async obtenerUnidadCobroPredominante(tecnicoId: string) {
    const tarifas = await this.tarifasRepository.find({
      where: { tecnico_id: tecnicoId },
      select: { unidad_cobro: true },
    });
    if (tarifas.length === 0) return null;
    const tienePorHora = tarifas.some((t) => t.unidad_cobro === 'por_hora');
    return tienePorHora ? 'por_hora' : 'por_servicio';
  }

  private async toView(fila: Record<string, unknown>) {
    const unidad_cobro = await this.obtenerUnidadCobroPredominante(fila.tecnico_id as string);
    return {
      id: fila.id,
      estado: fila.estado,
      descripcion: fila.descripcion,
      direccion: fila.direccion,
      motivo_rechazo: fila.motivo_rechazo,
      fecha_propuesta: fila.fecha_propuesta,
      hora_propuesta: fila.hora_propuesta,
      hora_fin_estimada: fila.hora_fin_estimada,
      fecha_solicitud: fila.fecha_solicitud,
      fecha_aceptacion: fila.fecha_aceptacion,
      fecha_completada: fila.fecha_completada,
      cliente: {
        id: fila.cliente_id,
        nombres: fila.cliente_nombres,
        apellidos: fila.cliente_apellidos,
      },
      tecnico: {
        id: fila.tecnico_id,
        nombres: fila.tecnico_nombres,
        apellidos: fila.tecnico_apellidos,
      },
      unidad_cobro,
    };
  }
}
