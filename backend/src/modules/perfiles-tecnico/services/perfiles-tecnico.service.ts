import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';

@Injectable()
export class PerfilesTecnicoService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
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
    return this.findOne(dto.usuario_id);
  }

  async findAll() {
    return this.perfilesRepository.find({ order: { usuario_id: 'ASC' } });
  }

  async findAllPublic() {
    const perfiles = await this.perfilesRepository.find({ order: { usuario_id: 'ASC' } });
    return perfiles.map((perfil) => this.toPublic(perfil));
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

  async update(usuarioId: string, dto: UpdatePerfilTecnicoDto) {
    await this.findOne(usuarioId);
    await this.perfilesRepository.update({ usuario_id: usuarioId }, dto);
    return this.findOne(usuarioId);
  }

  async remove(usuarioId: string) {
    const perfil = await this.findOne(usuarioId);
    await this.perfilesRepository.remove(perfil);
    return { usuario_id: usuarioId, eliminado: true };
  }

  async verificar(usuarioId: string) {
    await this.findOne(usuarioId);
    await this.perfilesRepository.update(
      { usuario_id: usuarioId },
      { verificado: true, fecha_verificacion: new Date() },
    );
    return this.findOne(usuarioId);
  }

  async desverificar(usuarioId: string) {
    const perfil = await this.findOne(usuarioId);
    perfil.verificado = false;
    perfil.fecha_verificacion = null;
    return this.perfilesRepository.save(perfil);
  }

  async calificar(usuarioId: string, dto: CalificarPerfilTecnicoDto) {
    const perfil = await this.findOne(usuarioId);
    const serviciosCompletados = perfil.total_servicios_completados;
    const promedioActual = perfil.calificacion_promedio;
    const nuevoPromedio =
      (promedioActual * serviciosCompletados + dto.calificacion) /
      (serviciosCompletados + 1);
    const redondeado = Math.round(nuevoPromedio * 100) / 100;
    await this.perfilesRepository.update(
      { usuario_id: usuarioId },
      { calificacion_promedio: redondeado },
    );
    return this.findOne(usuarioId);
  }

  async registrarServicioCompletado(usuarioId: string) {
    await this.findOne(usuarioId);
    await this.perfilesRepository.increment(
      { usuario_id: usuarioId },
      'total_servicios_completados',
      1,
    );
    return this.findOne(usuarioId);
  }
}