import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { Usuario, EstadoUsuario, RolUsuario } from '../../usuarios/entities/usuario.entity';
import { CertificacionTecnico, EstadoCertificacion } from '../entities/certificacion-tecnico.entity';
import { CalificacionTecnico } from '../../solicitudes/entities/calificacion-tecnico.entity';
import { PerfilesTecnicoCategoriasService } from './perfiles-tecnico-categorias.service';
import { PerfilesTecnicoCertificacionesService } from './perfiles-tecnico-certificaciones.service';
import { PerfilesTecnicoTarifasService } from './perfiles-tecnico-tarifas.service';
import { toDirectorio, toPublic } from './perfiles-tecnico.helpers';

@Injectable()
export class PerfilesTecnicoConsultaService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(CalificacionTecnico)
    private readonly calificacionesRepository: Repository<CalificacionTecnico>,
    private readonly categoriasService: PerfilesTecnicoCategoriasService,
    private readonly certificacionesService: PerfilesTecnicoCertificacionesService,
    private readonly tarifasService: PerfilesTecnicoTarifasService,
  ) {}

  async directorioPublic() {
    const filas = await this.perfilesRepository
      .createQueryBuilder('p')
      .innerJoin(Usuario, 'u', 'u.id = p.usuario_id')
      .select([
        'u.id AS id',
        'u.nombres AS nombres',
        'u.apellidos AS apellidos',
        'u.email AS email',
        'p.verificado AS verificado',
        'p.calificacion_promedio AS calificacion_promedio',
        'p.total_servicios_completados AS total_servicios_completados',
      ])
      .where('u.estado = :activo', { activo: EstadoUsuario.ACTIVO })
      .orderBy('p.calificacion_promedio', 'DESC')
      .addOrderBy('u.nombres', 'ASC')
      .getRawMany<{
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        verificado: boolean;
        calificacion_promedio: string | number;
        total_servicios_completados: string | number;
      }>();
    return toDirectorio(filas);
  }

  async listarTecnicosAdmin(page: number, limit: number, busqueda?: string) {
    const qb = this.perfilesRepository
      .createQueryBuilder('p')
      .innerJoin(Usuario, 'u', 'u.id = p.usuario_id')
      .select([
        'u.id AS id',
        'u.nombres AS nombres',
        'u.apellidos AS apellidos',
        'u.email AS email',
        'u.telefono AS telefono',
        'u.estado AS usuario_estado',
        'u.fecha_registro AS fecha_registro',
        'p.verificado AS verificado',
        'p.fecha_verificacion AS fecha_verificacion',
        'p.biografia AS biografia',
        'p.anios_experiencia AS anios_experiencia',
        'p.radio_cobertura_km AS radio_cobertura_km',
        'p.calificacion_promedio AS calificacion_promedio',
        'p.total_servicios_completados AS total_servicios_completados',
      ]);
    if (busqueda) {
      qb.andWhere(
        '(u.nombres ILIKE :q OR u.apellidos ILIKE :q OR u.email ILIKE :q)',
        { q: `%${busqueda}%` },
      );
    }
    const total = await qb.getCount();
    const filas = await qb
      .orderBy('u.fecha_registro', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();
    return {
      data: filas.map((fila) => ({
        ...fila,
        calificacion_promedio: Number(fila.calificacion_promedio),
        radio_cobertura_km: fila.radio_cobertura_km === null ? null : Number(fila.radio_cobertura_km),
      })),
      total,
      page,
      limit,
    };
  }

  async detalleTecnicoAdmin(usuarioId: string) {
    const [perfil, categorias, certificaciones] = await Promise.all([
      this.findOne(usuarioId),
      this.categoriasService.obtenerCategorias(usuarioId),
      this.certificacionesService.obtenerCertificaciones(usuarioId),
    ]);
    return { perfil, categorias, certificaciones };
  }

  async findOne(usuarioId: string) {
    const perfil = await this.perfilesRepository.findOneBy({ usuario_id: usuarioId });
    if (!perfil) {
      throw new NotFoundException(`Perfil técnico del usuario ${usuarioId} no encontrado`);
    }
    return perfil;
  }

  async findOnePublic(usuarioId: string) {
    return toPublic(await this.findOne(usuarioId));
  }

  async perfilPublico(usuarioId: string) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id: usuarioId },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        avatar_url: true,
        rol: true,
        estado: true,
      },
    });
    if (!usuario || usuario.rol !== RolUsuario.TECNICO) {
      throw new NotFoundException('Técnico no encontrado');
    }

    const [perfil, categorias, tarifas, certificaciones, calificaciones, totalCalificaciones] =
      await Promise.all([
        this.findOne(usuarioId),
        this.categoriasService.obtenerCategorias(usuarioId),
        this.tarifasService.obtenerTarifas(usuarioId),
        this.certificacionesService.obtenerCertificaciones(usuarioId),
        this.obtenerCalificaciones(usuarioId),
        this.calificacionesRepository.count({ where: { tecnico_id: usuarioId } }),
      ]);

    const nombrePorCategoria = new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));

    return {
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        avatar_url: usuario.avatar_url,
      },
      perfil: {
        biografia: perfil.biografia,
        anios_experiencia: perfil.anios_experiencia,
        radio_cobertura_km: perfil.radio_cobertura_km,
        verificado: perfil.verificado,
        calificacion_promedio: perfil.calificacion_promedio,
        total_servicios_completados: perfil.total_servicios_completados,
      },
      categorias: categorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        icono: categoria.icono,
      })),
      tarifas: tarifas.map((tarifa) => ({
        categoria_id: tarifa.categoria_id,
        categoria_nombre: nombrePorCategoria.get(tarifa.categoria_id) ?? null,
        precio_min: tarifa.precio_min,
        precio_max: tarifa.precio_max,
        unidad_cobro: tarifa.unidad_cobro,
      })),
      certificaciones: certificaciones
        .filter((certificacion) => certificacion.estado === EstadoCertificacion.APROBADA)
        .map((certificacion) => this.toCertificacionPublica(certificacion)),
      calificaciones,
      total_calificaciones: totalCalificaciones,
    };
  }

  private toCertificacionPublica(certificacion: CertificacionTecnico) {
    return {
      tipo_documento: certificacion.tipo_documento,
      estado: certificacion.estado,
      fecha_revision: certificacion.fecha_revision,
    };
  }

  private async obtenerCalificaciones(tecnicoId: string) {
    const filas = await this.calificacionesRepository
      .createQueryBuilder('calificacion')
      .innerJoin(Usuario, 'cliente', 'cliente.id = calificacion.cliente_id')
      .select([
        'calificacion.id AS id',
        'calificacion.calificacion AS calificacion',
        'calificacion.comentario AS comentario',
        'calificacion.fecha_creacion AS fecha_creacion',
        'cliente.nombres AS cliente_nombres',
        'cliente.apellidos AS cliente_apellidos',
      ])
      .where('calificacion.tecnico_id = :tecnicoId', { tecnicoId })
      .orderBy('calificacion.fecha_creacion', 'DESC')
      .limit(20)
      .getRawMany<{
        id: string;
        calificacion: string | number;
        comentario: string | null;
        fecha_creacion: Date;
        cliente_nombres: string;
        cliente_apellidos: string;
      }>();

    return filas.map((fila) => ({
      id: fila.id,
      calificacion: Number(fila.calificacion),
      comentario: fila.comentario,
      fecha_creacion: fila.fecha_creacion,
      cliente: {
        nombres: fila.cliente_nombres,
        apellidos: fila.cliente_apellidos,
      },
    }));
  }
}
