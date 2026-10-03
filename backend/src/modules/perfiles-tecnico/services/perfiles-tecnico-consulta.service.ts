import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { Usuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { PerfilesTecnicoCategoriasService } from './perfiles-tecnico-categorias.service';
import { PerfilesTecnicoCertificacionesService } from './perfiles-tecnico-certificaciones.service';

@Injectable()
export class PerfilesTecnicoConsultaService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    private readonly categoriasService: PerfilesTecnicoCategoriasService,
    private readonly certificacionesService: PerfilesTecnicoCertificacionesService,
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
    return this.toDirectorio(filas);
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
    return this.toPublic(await this.findOne(usuarioId));
  }

  private toPublic(perfil: PerfilTecnico) {
    const {
      biografia,
      anios_experiencia,
      calificacion_promedio,
      total_servicios_completados,
      verificado,
    } = perfil;
    return {
      usuario_id: perfil.usuario_id,
      biografia,
      anios_experiencia,
      calificacion_promedio,
      total_servicios_completados,
      verificado,
    };
  }

  private toDirectorio(
    filas: {
      id: string;
      nombres: string;
      apellidos: string;
      email: string;
      verificado: boolean;
      calificacion_promedio: string | number;
      total_servicios_completados: string | number;
    }[],
  ) {
    return filas.map((fila) => ({
      ...fila,
      calificacion_promedio: Number(fila.calificacion_promedio ?? 0),
      total_servicios_completados: Number(fila.total_servicios_completados ?? 0),
    }));
  }
}
