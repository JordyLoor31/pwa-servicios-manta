import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';

import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { Usuario, RolUsuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { AceptarSolicitudDto } from '../dtos/aceptar-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SolicitudesDisponibilidadService } from './solicitudes-disponibilidad.service';
import { SolicitudesNotificacionesService } from './solicitudes-notificaciones.service';

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
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
    private readonly dataSource: DataSource,
    private readonly disponibilidadService: SolicitudesDisponibilidadService,
    private readonly notificacionesService: SolicitudesNotificacionesService,
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
    await Promise.all(
      tecnicosDisponibles.map((tecnico) => this.notificacionesService.nueva(tecnico.id, vista)),
    );
    if (dto.tecnico_id && !tecnicosDisponibles.some((t) => t.id === dto.tecnico_id)) {
      await this.notificacionesService.nueva(dto.tecnico_id, vista);
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
    const unidadesCobro = await this.obtenerUnidadesCobro(
      filas.map((fila) => fila.tecnico_id).filter((id): id is string => Boolean(id)),
    );
    return {
      data: await Promise.all(filas.map((fila) => this.toView(fila, unidadesCobro))),
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
    return await this.toView(fila, await this.obtenerUnidadesCobro([fila.tecnico_id]));
  }

  async aceptar(id: string, dto: AceptarSolicitudDto, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id || s.tecnico_id === null,
      'Solo el tǸcnico destinatario puede aceptar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'Solo se puede aceptar una solicitud pendiente');

    const tecnicoId = solicitud.tecnico_id ?? user.id;
    const horaInicio = dto.hora_inicio;
    const horaFin = this.disponibilidadService.sumarHoras(horaInicio, dto.duracion_horas);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Solicitud).update(solicitud.id, {
        estado: EstadoSolicitud.ACEPTADA,
        fecha_aceptacion: new Date(),
        fecha_propuesta: dto.fecha_servicio,
        hora_propuesta: horaInicio,
        hora_fin_estimada: horaFin,
        tecnico_id: tecnicoId,
      });
      await this.disponibilidadService.reservar(
        manager,
        tecnicoId,
        solicitud.id,
        dto.fecha_servicio,
        horaInicio,
        horaFin,
      );
    });
    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Solicitud aceptada',
      `${this.nombreUsuario(vista, 'tecnico') || 'El técnico'} ${this.apellidoUsuario(vista, 'tecnico')} aceptó tu solicitud para el ${dto.fecha_servicio} a las ${horaInicio}.`,
      '/solicitudes',
    );
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
    await this.disponibilidadService.liberarReserva(solicitud.id);
    const vista = await this.detalle(id, user);
    await this.notificacionesService.actualizada(
      solicitud.cliente_id,
      vista,
      'Servicio completado',
      `${this.nombreUsuario(vista, 'tecnico') || 'El técnico'} ${this.apellidoUsuario(vista, 'tecnico')} completó tu servicio.`,
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
      's.direccion_latitud AS direccion_latitud',
      's.direccion_longitud AS direccion_longitud',
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

  private async obtenerUnidadesCobro(tecnicoIds: string[]) {
    const ids = [...new Set(tecnicoIds.filter(Boolean))];
    if (ids.length === 0) {
      return new Map<string, 'por_hora' | 'por_servicio'>();
    }
    const tarifas = await this.tarifasRepository.find({
      where: { tecnico_id: In(ids) },
      select: { unidad_cobro: true },
    });
    const unidades = new Map<string, 'por_hora' | 'por_servicio'>();
    for (const tarifa of tarifas) {
      if (tarifa.unidad_cobro === 'por_hora') {
        unidades.set(tarifa.tecnico_id, 'por_hora');
      } else if (!unidades.has(tarifa.tecnico_id)) {
        unidades.set(tarifa.tecnico_id, 'por_servicio');
      }
    }
    return unidades;
  }

  private async toView(
    fila: Record<string, unknown>,
    unidadesCobro: Map<string, 'por_hora' | 'por_servicio'>,
  ): Promise<Record<string, unknown>> {
    const unidad_cobro = unidadesCobro.get(fila.tecnico_id as string) ?? null;
    return {
      id: fila.id,
      estado: fila.estado,
      descripcion: fila.descripcion,
      direccion: fila.direccion,
      direccion_latitud: fila.direccion_latitud != null ? Number(fila.direccion_latitud) : null,
      direccion_longitud: fila.direccion_longitud != null ? Number(fila.direccion_longitud) : null,
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
