import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Solicitud } from '../entities/solicitud.entity';
import { PostulacionSolicitud } from '../entities/postulacion-solicitud.entity';
import { SolicitudCategoria } from '../entities/solicitud-categoria.entity';
import { CalificacionTecnico } from '../entities/calificacion-tecnico.entity';
import { TarifaTecnico } from '../../perfiles-tecnico/entities/tarifa-tecnico.entity';
import { RolUsuario, Usuario } from '../../usuarios/entities/usuario.entity';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';
import { Direccion } from '../../direcciones/entities/direccion.entity';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  columnasBase,
  toSolicitudView,
  type CategoriaSolicitudView,
  type SolicitudFila,
  type UnidadCobro,
} from './solicitud-view.mapper';
import { EstadoSolicitud } from '../entities/solicitud.entity';
import { calcularDistanciaKm } from '../utils/geo';

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
    @InjectRepository(CalificacionTecnico)
    private readonly calificacionesRepository: Repository<CalificacionTecnico>,
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(Direccion)
    private readonly direccionesRepository: Repository<Direccion>,
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
    const postulaciones = await this.postulacionesRepository
      .createQueryBuilder('postulacion')
      .innerJoin(Usuario, 'tecnico', 'tecnico.id = postulacion.tecnico_id')
      .innerJoin(PerfilTecnico, 'perfil', 'perfil.usuario_id = postulacion.tecnico_id')
      .leftJoin(
        'direcciones',
        'direccion_tecnico',
        'direccion_tecnico.usuario_id = postulacion.tecnico_id AND direccion_tecnico.es_principal = true',
      )
      .where('postulacion.solicitud_id = :id', { id })
      .select([
        'postulacion.id AS id',
        'postulacion.solicitud_id AS solicitud_id',
        'postulacion.tecnico_id AS tecnico_id',
        'postulacion.unidad_cobro AS unidad_cobro',
        'postulacion.precio AS precio',
        'postulacion.tipo_servicio AS tipo_servicio',
        'postulacion.categoria_id AS categoria_id',
        'postulacion.negociable AS negociable',
        'postulacion.mensaje AS mensaje',
        'postulacion.estado AS estado',
        'postulacion.fecha_postulacion AS fecha_postulacion',
        'tecnico.nombres AS tecnico_nombres',
        'tecnico.apellidos AS tecnico_apellidos',
        'tecnico.avatar_url AS tecnico_avatar_url',
        'perfil.verificado AS tecnico_verificado',
        'perfil.calificacion_promedio AS tecnico_calificacion',
        'perfil.total_servicios_completados AS tecnico_servicios_completados',
        'perfil.biografia AS tecnico_biografia',
        'perfil.anios_experiencia AS tecnico_anios_experiencia',
        'perfil.radio_cobertura_km AS tecnico_radio_cobertura_km',
        'direccion_tecnico.latitud AS tecnico_latitud',
        'direccion_tecnico.longitud AS tecnico_longitud',
        's.direccion_latitud AS solicitud_latitud',
        's.direccion_longitud AS solicitud_longitud',
      ])
      .innerJoin(Solicitud, 's', 's.id = postulacion.solicitud_id')
      .orderBy('postulacion.fecha_postulacion', 'ASC')
      .getRawMany<{
        tecnico_latitud: string | number | null;
        tecnico_longitud: string | number | null;
        solicitud_latitud: string | number | null;
        solicitud_longitud: string | number | null;
        tecnico_radio_cobertura_km: string | number | null;
        tecnico_anios_experiencia: string | number | null;
        [key: string]: unknown;
      }>();

    return postulaciones.map((postulacion) => {
      const distanciaKm = calcularDistanciaKm(
        postulacion.solicitud_latitud,
        postulacion.solicitud_longitud,
        postulacion.tecnico_latitud,
        postulacion.tecnico_longitud,
      );
      const radioCoberturaKm =
        postulacion.tecnico_radio_cobertura_km == null
          ? null
          : Number(postulacion.tecnico_radio_cobertura_km);
      return {
        ...postulacion,
        tecnico_calificacion: Number(postulacion.tecnico_calificacion ?? 0),
        tecnico_servicios_completados: Number(postulacion.tecnico_servicios_completados ?? 0),
        tecnico_anios_experiencia:
          postulacion.tecnico_anios_experiencia == null
            ? null
            : Number(postulacion.tecnico_anios_experiencia),
        tecnico_radio_cobertura_km: radioCoberturaKm,
        tecnico_distancia_km: distanciaKm,
        tecnico_cubre_zona:
          distanciaKm == null || radioCoberturaKm == null
            ? null
            : distanciaKm <= radioCoberturaKm,
      };
    });
  }

  async listarMis(clienteId: string, filtros: FiltrosSolicitudes) {
    return this.listarConJoin(filtros, 's.cliente_id = :cliente_id', {
      cliente_id: clienteId,
    });
  }

  async listarRecibidas(tecnicoId: string, filtros: FiltrosSolicitudes) {
    const resultado = await this.listarConJoin(
      filtros,
      `(
        s.tecnico_id = :tecnico_id
        OR (
          s.tecnico_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM solicitudes_categorias sc
            INNER JOIN tecnico_categoria tc ON tc.categoria_id = sc.categoria_id
            WHERE sc.solicitud_id = s.id AND tc.tecnico_id = :tecnico_id
          )
        )
      )`,
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
    const [direccionTecnico, perfilTecnico] = await Promise.all([
      this.direccionesRepository.findOneBy({ usuario_id: tecnicoId, es_principal: true }),
      this.perfilesRepository.findOneBy({ usuario_id: tecnicoId }),
    ]);
    const radioCoberturaKm = perfilTecnico?.radio_cobertura_km ?? null;
    return {
      ...resultado,
      data: resultado.data.map((solicitud: Record<string, unknown>) => {
        const distanciaKm = calcularDistanciaKm(
          solicitud.direccion_latitud as string | number | null,
          solicitud.direccion_longitud as string | number | null,
          direccionTecnico?.latitud ?? null,
          direccionTecnico?.longitud ?? null,
        );
        return {
          ...solicitud,
          postulado_por_mi: estadosPorSolicitud.has(solicitud.id as string),
          estado_mi_postulacion: estadosPorSolicitud.get(solicitud.id as string) ?? null,
          tecnico_radio_cobertura_km: radioCoberturaKm,
          tecnico_distancia_km: distanciaKm,
          tecnico_cubre_zona:
            distanciaKm == null || radioCoberturaKm == null
              ? null
              : distanciaKm <= radioCoberturaKm,
        };
      }),
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
    const vista = toSolicitudView(
      fila as SolicitudFila,
      await this.obtenerUnidadesCobro([fila.tecnico_id]),
      await this.obtenerCategorias([id]),
    );
    const calificacion = await this.calificacionesRepository.findOneBy({ solicitud_id: id });
    const postulacion =
      user.rol === RolUsuario.TECNICO
        ? await this.postulacionesRepository.findOne({
            where: { solicitud_id: id, tecnico_id: user.id },
            select: { estado: true },
          })
        : null;
    return {
      ...vista,
      calificacion,
      postulado_por_mi: Boolean(postulacion),
      estado_mi_postulacion: postulacion?.estado ?? null,
    };
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
    const calificaciones = await this.obtenerCalificaciones(
      filas.map((fila) => fila.id as string),
    );
    return {
      data: filas.map((fila) => ({
        ...toSolicitudView(fila as SolicitudFila, unidadesCobro, categoriasPorSolicitud),
        calificacion: calificaciones.get(fila.id as string) ?? null,
      })),
      total,
      page: filtros.page,
      limit: filtros.limit,
    };
  }

  private asegurarAcceso(
    fila: { cliente_id: string; tecnico_id: string | null },
    user: AuthenticatedUser,
  ) {
    const esTecnicoDisponible =
      user.rol === RolUsuario.TECNICO && fila.tecnico_id === null;
    if (
      user.rol !== RolUsuario.ADMIN &&
      user.id !== fila.cliente_id &&
      user.id !== fila.tecnico_id &&
      !esTecnicoDisponible
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
      unidades.set(tarifa.tecnico_id, 'por_visita');
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

  private async obtenerCalificaciones(solicitudIds: string[]) {
    const ids = [...new Set(solicitudIds.filter(Boolean))];
    const calificacionesPorSolicitud = new Map<string, CalificacionTecnico>();
    if (ids.length === 0) return calificacionesPorSolicitud;
    const calificaciones = await this.calificacionesRepository.find({
      where: { solicitud_id: In(ids) },
    });
    for (const calificacion of calificaciones) {
      calificacionesPorSolicitud.set(calificacion.solicitud_id, calificacion);
    }
    return calificacionesPorSolicitud;
  }
}
