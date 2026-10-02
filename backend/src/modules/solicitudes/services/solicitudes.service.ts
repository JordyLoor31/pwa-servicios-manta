import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, EstadoSolicitud } from '../entities/solicitud.entity';
import { Usuario, RolUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { CrearSolicitudDto } from '../dtos/crear-solicitud.dto';
import { RechazarSolicitudDto } from '../dtos/rechazar-solicitud.dto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

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
  ) {}

  async crear(clienteId: string, dto: CrearSolicitudDto) {
    if (clienteId === dto.tecnico_id) {
      throw new BadRequestException('No puedes solicitar un servicio a tu propio perfil');
    }
    const tecnico = await this.usuariosRepository.findOneBy({ id: dto.tecnico_id });
    if (!tecnico) {
      throw new NotFoundException('El técnico seleccionado no existe');
    }
    if (tecnico.rol !== RolUsuario.TECNICO) {
      throw new BadRequestException('El usuario seleccionado no es un técnico');
    }
    const perfil = await this.perfilesRepository.findOneBy({ usuario_id: dto.tecnico_id });
    if (!perfil) {
      throw new BadRequestException('El técnico aún no ha completado su perfil');
    }
    const solicitud = await this.solicitudesRepository.save({
      cliente_id: clienteId,
      tecnico_id: dto.tecnico_id,
      descripcion: dto.descripcion.trim(),
      direccion: dto.direccion?.trim() || null,
      estado: EstadoSolicitud.PENDIENTE,
    });
    return this.detalle(solicitud.id, { id: clienteId, rol: RolUsuario.CLIENTE } as AuthenticatedUser);
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
      's.tecnico_id = :tecnico_id',
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
      .innerJoin(Usuario, 'tec', 'tec.id = s.tecnico_id')
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
      data: filas.map((fila) => this.toView(fila)),
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
    return this.toView(fila);
  }

  async aceptar(id: string, user: AuthenticatedUser) {
    const solicitud = await this.obtenerParaAccion(
      id,
      user,
      (s) => s.tecnico_id === user.id,
      'Solo el técnico destinatario puede aceptar la solicitud',
    );
    this.verEstado(solicitud, [EstadoSolicitud.PENDIENTE], 'Solo se puede aceptar una solicitud pendiente');
    await this.solicitudesRepository.update(solicitud.id, {
      estado: EstadoSolicitud.ACEPTADA,
      fecha_aceptacion: new Date(),
    });
    return this.detalle(id, user);
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
    return this.detalle(id, user);
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
    return this.detalle(id, user);
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
    await this.perfilesRepository.increment(
      { usuario_id: solicitud.tecnico_id },
      'total_servicios_completados',
      1,
    );
    return this.detalle(id, user);
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

  private async buscarFila(id: string) {
    return this.solicitudesRepository
      .createQueryBuilder('s')
      .innerJoin(Usuario, 'cli', 'cli.id = s.cliente_id')
      .innerJoin(Usuario, 'tec', 'tec.id = s.tecnico_id')
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

  private toView(fila: Record<string, unknown>) {
    return {
      id: fila.id,
      estado: fila.estado,
      descripcion: fila.descripcion,
      direccion: fila.direccion,
      motivo_rechazo: fila.motivo_rechazo,
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
    };
  }
}