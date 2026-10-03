import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';
import { SlotDisponibilidadDto } from '../dtos/reemplazar-disponibilidad.dto';
import { CrearCertificacionDto } from '../dtos/crear-certificacion.dto';
import { RevisarCertificacionDto } from '../dtos/revisar-certificacion.dto';
import { RangoPrecioDto } from '../dtos/reemplazar-tarifas.dto';
import { PerfilesTecnicoConsultaService } from './perfiles-tecnico-consulta.service';
import { PerfilesTecnicoDisponibilidadService } from './perfiles-tecnico-disponibilidad.service';
import { PerfilesTecnicoCategoriasService } from './perfiles-tecnico-categorias.service';
import { PerfilesTecnicoTarifasService } from './perfiles-tecnico-tarifas.service';
import { PerfilesTecnicoCertificacionesService } from './perfiles-tecnico-certificaciones.service';
import { toPublic } from './perfiles-tecnico.helpers';

@Injectable()
export class PerfilesTecnicoService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    private readonly consultaService: PerfilesTecnicoConsultaService,
    private readonly disponibilidadService: PerfilesTecnicoDisponibilidadService,
    private readonly categoriasService: PerfilesTecnicoCategoriasService,
    private readonly tarifasService: PerfilesTecnicoTarifasService,
    private readonly certificacionesService: PerfilesTecnicoCertificacionesService,
  ) {}

  async create(dto: CreatePerfilTecnicoDto) {
    if (!dto.usuario_id) {
      throw new BadRequestException('usuario_id es requerido');
    }
    try {
      await this.perfilesRepository.insert(dto);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('El usuario ya tiene un perfil técnico');
      }
      if ((error as { code?: string })?.code === '23503') {
        throw new BadRequestException('El usuario no existe');
      }
      throw error;
    }
    return this.consultaService.findOne(dto.usuario_id);
  }

  async findAll() {
    return this.perfilesRepository.find({ order: { usuario_id: 'ASC' } });
  }

  async findAllPublic() {
    const perfiles = await this.perfilesRepository.find({ order: { usuario_id: 'ASC' } });
    return perfiles.map((perfil) => toPublic(perfil));
  }

  async directorioPublic() {
    return this.consultaService.directorioPublic();
  }

  async disponiblesPublic(dia: number, hora: string, categorias: string[] = []) {
    return this.disponibilidadService.disponiblesPublic(dia, hora, categorias);
  }

  async disponiblesPorDia(dia: number, categorias: string[] = []) {
    return this.disponibilidadService.disponiblesPorDia(dia, categorias);
  }

  async disponiblesPorFecha(fecha: string, categorias: string[] = [], tecnicoId?: string) {
    return this.disponibilidadService.disponiblesPorFecha(fecha, categorias, tecnicoId);
  }

  async horariosDisponibles(dia: number, categorias: string[] = [], tecnicoId?: string) {
    return this.disponibilidadService.horariosDisponibles(dia, categorias, tecnicoId);
  }

  async horariosDisponiblesPorFecha(
    fecha: string,
    tecnicoId: string,
    categorias: string[] = [],
  ) {
    return this.disponibilidadService.horariosDisponiblesPorFecha(fecha, tecnicoId, categorias);
  }

  async findOne(usuarioId: string) {
    return this.consultaService.findOne(usuarioId);
  }

  async findOnePublic(usuarioId: string) {
    return this.consultaService.findOnePublic(usuarioId);
  }

  async update(usuarioId: string, dto: UpdatePerfilTecnicoDto) {
    await this.consultaService.findOne(usuarioId);
    await this.perfilesRepository.update({ usuario_id: usuarioId }, dto);
    return this.consultaService.findOne(usuarioId);
  }

  async remove(usuarioId: string) {
    const perfil = await this.consultaService.findOne(usuarioId);
    await this.perfilesRepository.remove(perfil);
    return { usuario_id: usuarioId, eliminado: true };
  }

  async verificar(usuarioId: string) {
    await this.consultaService.findOne(usuarioId);
    await this.perfilesRepository.update(
      { usuario_id: usuarioId },
      { verificado: true, fecha_verificacion: new Date() },
    );
    return this.consultaService.findOne(usuarioId);
  }

  async desverificar(usuarioId: string) {
    const perfil = await this.consultaService.findOne(usuarioId);
    perfil.verificado = false;
    perfil.fecha_verificacion = null;
    return this.perfilesRepository.save(perfil);
  }

  async calificar(usuarioId: string, dto: CalificarPerfilTecnicoDto) {
    await this.consultaService.findOne(usuarioId);
    await this.perfilesRepository
      .createQueryBuilder()
      .update(PerfilTecnico)
      .set({
        calificacion_promedio: () =>
          'ROUND(((calificacion_promedio * total_servicios_completados + :calificacion) / (total_servicios_completados + 1))::numeric, 2)',
      })
      .where('usuario_id = :usuarioId', { usuarioId })
      .setParameter('calificacion', dto.calificacion)
      .execute();
    return this.consultaService.findOne(usuarioId);
  }

  async registrarServicioCompletado(usuarioId: string) {
    await this.consultaService.findOne(usuarioId);
    const resultado = await this.perfilesRepository.increment(
      { usuario_id: usuarioId },
      'total_servicios_completados',
      1,
    );
    if (resultado.affected === 0) {
      return this.consultaService.findOne(usuarioId);
    }
    return this.consultaService.findOne(usuarioId);
  }

  async obtenerCategorias(usuarioId: string) {
    return this.categoriasService.obtenerCategorias(usuarioId);
  }

  async reemplazarCategorias(usuarioId: string, categoriaIds: string[]) {
    return this.categoriasService.reemplazarCategorias(usuarioId, categoriaIds);
  }

  async obtenerTarifas(usuarioId: string) {
    return this.tarifasService.obtenerTarifas(usuarioId);
  }

  async reemplazarTarifas(usuarioId: string, tarifas: RangoPrecioDto[]) {
    return this.tarifasService.reemplazarTarifas(usuarioId, tarifas);
  }

  async obtenerDisponibilidad(usuarioId: string) {
    return this.disponibilidadService.obtenerDisponibilidad(usuarioId);
  }

  async reemplazarDisponibilidad(usuarioId: string, slots: SlotDisponibilidadDto[]) {
    return this.disponibilidadService.reemplazarDisponibilidad(usuarioId, slots);
  }

  async eliminarDisponibilidad(usuarioId: string) {
    return this.disponibilidadService.eliminarDisponibilidad(usuarioId);
  }

  async obtenerCertificaciones(usuarioId: string) {
    return this.certificacionesService.obtenerCertificaciones(usuarioId);
  }

  async agregarCertificacion(usuarioId: string, dto: CrearCertificacionDto) {
    return this.certificacionesService.agregarCertificacion(usuarioId, dto);
  }

  async eliminarCertificacion(usuarioId: string, certificacionId: string) {
    return this.certificacionesService.eliminarCertificacion(usuarioId, certificacionId);
  }

  async revisarCertificacion(certificacionId: string, dto: RevisarCertificacionDto) {
    return this.certificacionesService.revisarCertificacion(certificacionId, dto);
  }

  async listarTecnicosAdmin(page: number, limit: number, busqueda?: string) {
    return this.consultaService.listarTecnicosAdmin(page, limit, busqueda);
  }

  async detalleTecnicoAdmin(usuarioId: string) {
    return this.consultaService.detalleTecnicoAdmin(usuarioId);
  }
}
