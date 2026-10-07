import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import {
  EstadoPostulacion,
  PostulacionSolicitud,
} from '../entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';

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
    @InjectRepository(PostulacionSolicitud)
    private readonly postulacionesRepository: Repository<PostulacionSolicitud>,
    @InjectRepository(SolicitudCategoria)
    private readonly solicitudCategoriasRepository: Repository<SolicitudCategoria>,
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
    const solicitud = await this.solicitudesRepository.findOneBy({ id });
    if (!solicitud || solicitud.cliente_id !== user.id) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (
      solicitud.estado === EstadoSolicitud.PENDIENTE &&
      solicitud.fecha_expiracion_oferta &&
      solicitud.fecha_expiracion_oferta.getTime() <= Date.now()
    ) {
      await this.solicitudesRepository.update(id, { estado: EstadoSolicitud.EXPIRADA });
    }
    return this.postulacionesRepository
      .createQueryBuilder('postulacion')
      .innerJoin(Usuario, 'tecnico', 'tecnico.id = postulacion.tecnico_id')
      .innerJoin(PerfilTecnico, 'perfil', 'perfil.usuario_id = postulacion.tecnico_id')
      .where('postulacion.solicitud_id = :id', { id })
      .select([
        'postulacion.id AS id',
        'postulacion.solicitud_id AS solicitud_id',
        'postulacion.tecnico_id AS tecnico_id',
        'postulacion.unidad_cobro AS unidad_cobro',
        'postulacion.precio AS precio',
        'postulacion.mensaje AS mensaje',
        'postulacion.estado AS estado',
        'postulacion.fecha_postulacion AS fecha_postulacion',
        'tecnico.nombres AS tecnico_nombres',
        'tecnico.apellidos AS tecnico_apellidos',
        'tecnico.avatar_url AS tecnico_avatar_url',
        'perfil.verificado AS tecnico_verificado',
        'perfil.calificacion_promedio AS tecnico_calificacion',
        'perfil.total_servicios_completados AS tecnico_servicios_completados',
      ])
      .orderBy('postulacion.fecha_postulacion', 'ASC')
      .getRawMany();
  }

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
    const vista = await this.detalle(id, { id: solicitud.cliente_id, rol: RolUsuario.CLIENTE } as AuthenticatedUser);
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
    const vista = await this.detalle(id, user);
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

  async listarMis(clienteId: string, filtros: FiltrosPaginados) {
    return this.listarConJoin(
      filtros,
      's.cliente_id = :cliente_id',
      { cliente_id: clienteId },
    );
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosPaginados) {
    const resultado = await this.listarConJoin(
      filtros,
      '(s.tecnico_id = :tecnico_id OR s.tecnico_id IS NULL)',
      { tecnico_id: tecnicoId },
    );
    const ids = resultado.data.map((solicitud: Record<string, unknown>) => solicitud.id);
    const postulaciones = ids.length
      ? await this.postulacionesRepository.find({
          where: {
            tecnico_id: tecnicoId,
            solicitud_id: In(ids),
          },
          select: { solicitud_id: true, estado: true },
        })
      : [];
    const estadosPorSolicitud = new Map(
      postulaciones.map((postulacion) => [postulacion.solicitud_id, postulacion.estado]),
    );
    return {
      ...resultado,
      data: resultado.data.map((solicitud: Record<string, unknown>) => ({
        ...solicitud,
        postulado_por_mi: estadosPorSolicitud.has(solicitud.id as string),
        estado_mi_postulacion: estadosPorSolicitud.get(solicitud.id as string) ?? null,
      })),
    };
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
    const categoriasPorSolicitud = await this.obtenerCategorias(filas.map((fila) => fila.id as string));
    return {
      data: await Promise.all(
        filas.map((fila) => this.toView(fila, unidadesCobro, categoriasPorSolicitud)),
      ),
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
    return await this.toView(
      fila,
      await this.obtenerUnidadesCobro([fila.tecnico_id]),
      await this.obtenerCategorias([id]),
    );
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
      's.duracion_oferta_minutos AS duracion_oferta_minutos',
      's.fecha_expiracion_oferta AS fecha_expiracion_oferta',
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

  private async obtenerCategorias(solicitudIds: string[]) {
    const ids = [...new Set(solicitudIds.filter(Boolean))];
    const categoriasPorSolicitud = new Map<string, Array<{ id: string; nombre: string; icono: string | null }>>();
    if (ids.length === 0) return categoriasPorSolicitud;
    const filas = await this.solicitudCategoriasRepository
      .createQueryBuilder('sc')
      .innerJoin('categorias_servicio', 'categoria', 'categoria.id = sc.categoria_id')
      .where('sc.solicitud_id IN (:...ids)', { ids })
      .select([
        'sc.solicitud_id AS solicitud_id',
        'categoria.id AS id',
        'categoria.nombre AS nombre',
        'categoria.icono AS icono',
      ])
      .orderBy('categoria.nombre', 'ASC')
      .getRawMany<{ solicitud_id: string; id: string; nombre: string; icono: string | null }>();
    for (const fila of filas) {
      const lista = categoriasPorSolicitud.get(fila.solicitud_id) ?? [];
      lista.push({ id: fila.id, nombre: fila.nombre, icono: fila.icono });
      categoriasPorSolicitud.set(fila.solicitud_id, lista);
    }
    return categoriasPorSolicitud;
  }

  private async toView(
    fila: Record<string, unknown>,
    unidadesCobro: Map<string, 'por_hora' | 'por_servicio'>,
    categoriasPorSolicitud: Map<string, Array<{ id: string; nombre: string; icono: string | null }>>,
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
      duracion_oferta_minutos: fila.duracion_oferta_minutos ?? null,
      fecha_expiracion_oferta: fila.fecha_expiracion_oferta ?? null,
      cliente: {
        id: fila.cliente_id,
        nombres: fila.cliente_nombres,
        apellidos: fila.cliente_apellidos,
      },
      tecnico: fila.tecnico_id
        ? {
            id: fila.tecnico_id,
            nombres: fila.tecnico_nombres,
            apellidos: fila.tecnico_apellidos,
          }
        : null,
      unidad_cobro,
      categorias: categoriasPorSolicitud.get(fila.id as string) ?? [],
    };
  }
}
