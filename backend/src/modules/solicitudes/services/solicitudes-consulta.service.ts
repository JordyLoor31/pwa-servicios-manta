import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Solicitud } from '../entities/solicitud.entity';
import { PostulacionSolicitud } from '../entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';
import { RolUsuario, Usuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  columnasBase,
  toSolicitudView,
  type CategoriaSolicitudView,
  type SolicitudFila,
  type UnidadCobro,
} from './solicitud-view.mapper';
import { EstadoSolicitud } from '../entities/solicitud.entity';

export interface FiltrosSolicitudes {
  page: number;
  limit: number;
  estado?: string;
}

@Injectable()
export class SolicitudesConsultaService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudesRepository: Repository<Solicitud>,
    @InjectRepository(PostulacionSolicitud)
    private readonly postulacionesRepository: Repository<PostulacionSolicitud>,
    @InjectRepository(SolicitudCategoria)
    private readonly solicitudCategoriasRepository: Repository<SolicitudCategoria>,
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
  ) {}

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

  async listarMis(clienteId: string, filtros: FiltrosSolicitudes) {
    return this.listarConJoin(filtros, 's.cliente_id = :cliente_id', {
      cliente_id: clienteId,
    });
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosSolicitudes) {
    const resultado = await this.listarConJoin(
      filtros,
      '(s.tecnico_id = :tecnico_id OR s.tecnico_id IS NULL)',
      { tecnico_id: tecnicoId },
    );
    const ids = resultado.data.map((solicitud: Record<string, unknown>) => solicitud.id);
    const postulaciones = ids.length
      ? await this.postulacionesRepository.find({
          where: { tecnico_id: tecnicoId, solicitud_id: In(ids as string[]) },
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

  async listarAdmin(filtros: FiltrosSolicitudes) {
    return this.listarConJoin(filtros);
  }

  async detalle(id: string, user: AuthenticatedUser) {
    const fila = await this.buscarFila(id);
    if (!fila) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    this.asegurarAcceso(fila, user);
    return toSolicitudView(
      fila as SolicitudFila,
      await this.obtenerUnidadesCobro([fila.tecnico_id]),
      await this.obtenerCategorias([id]),
    );
  }

  private async listarConJoin(
    filtros: FiltrosSolicitudes,
    condicionSql?: string,
    params?: Record<string, unknown>,
  ) {
    const qb = this.solicitudesRepository
      .createQueryBuilder('s')
      .innerJoin(Usuario, 'cli', 'cli.id = s.cliente_id')
      .leftJoin(Usuario, 'tec', 'tec.id = s.tecnico_id')
      .select(columnasBase());
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
      data: filas.map((fila) =>
        toSolicitudView(fila as SolicitudFila, unidadesCobro, categoriasPorSolicitud),
      ),
      total,
      page: filtros.page,
      limit: filtros.limit,
    };
  }

  private asegurarAcceso(
    fila: { cliente_id: string; tecnico_id: string | null },
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
      .select(columnasBase())
      .where('s.id = :id', { id })
      .getRawOne();
  }

  private async obtenerUnidadesCobro(tecnicoIds: (string | null)[]) {
    const ids = [...new Set(tecnicoIds.filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) {
      return new Map<string, UnidadCobro>();
    }
    const tarifas = await this.tarifasRepository.find({
      where: { tecnico_id: In(ids) },
      select: { unidad_cobro: true },
    });
    const unidades = new Map<string, UnidadCobro>();
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
    const categoriasPorSolicitud = new Map<string, CategoriaSolicitudView[]>();
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
}
