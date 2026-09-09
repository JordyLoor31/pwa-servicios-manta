import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from '../entities/disponibilidad-tecnico.entity';
import { TecnicoCategoria } from '../entities/tecnico-categoria.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { CreatePerfilTecnicoDto } from '../dtos/create-perfil-tecnico.dto';
import { UpdatePerfilTecnicoDto } from '../dtos/update-perfil-tecnico.dto';
import { CalificarPerfilTecnicoDto } from '../dtos/calificar-perfil-tecnico.dto';
import { SlotDisponibilidadDto } from '../dtos/reemplazar-disponibilidad.dto';

@Injectable()
export class PerfilesTecnicoService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(TecnicoCategoria)
    private readonly tecnicoCategoriaRepository: Repository<TecnicoCategoria>,
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    @InjectRepository(CategoriaServicio)
    private readonly categoriasRepository: Repository<CategoriaServicio>,
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

  async obtenerCategorias(usuarioId: string) {
    await this.findOne(usuarioId);
    const filas = await this.tecnicoCategoriaRepository.find({
      where: { tecnico_id: usuarioId },
      select: { categoria_id: true },
    });
    if (filas.length === 0) {
      return [];
    }
    const ids = filas.map((fila) => fila.categoria_id);
    return this.categoriasRepository.find({
      where: { id: In(ids) },
      order: { nombre: 'ASC' },
    });
  }

  async reemplazarCategorias(usuarioId: string, categoriaIds: string[]) {
    await this.findOne(usuarioId);
    const unicas = [...new Set(categoriaIds)];
    if (unicas.length > 0) {
      const encontradas = await this.categoriasRepository.count({
        where: { id: In(unicas) },
      });
      if (encontradas !== unicas.length) {
        throw new BadRequestException('Una o más categorías no existen');
      }
    }
    await this.tecnicoCategoriaRepository.delete({ tecnico_id: usuarioId });
    if (unicas.length > 0) {
      await this.tecnicoCategoriaRepository.insert(
        unicas.map((categoriaId) => ({ tecnico_id: usuarioId, categoria_id: categoriaId })),
      );
    }
    return this.obtenerCategorias(usuarioId);
  }

  async obtenerDisponibilidad(usuarioId: string) {
    await this.findOne(usuarioId);
    return this.disponibilidadRepository.find({
      where: { tecnico_id: usuarioId },
      order: { dia_semana: 'ASC', hora_inicio: 'ASC' },
    });
  }

  async reemplazarDisponibilidad(usuarioId: string, slots: SlotDisponibilidadDto[]) {
    await this.findOne(usuarioId);
    const normalizados = slots.map((slot) =>
      this.normalizarSlot(slot),
    );
    normalizados.sort(
      (a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio),
    );
    await this.disponibilidadRepository.delete({ tecnico_id: usuarioId });
    if (normalizados.length > 0) {
      await this.disponibilidadRepository.insert(
        normalizados.map((slot) => ({ tecnico_id: usuarioId, ...slot })),
      );
    }
    return this.obtenerDisponibilidad(usuarioId);
  }

  async eliminarDisponibilidad(usuarioId: string) {
    await this.findOne(usuarioId);
    await this.disponibilidadRepository.delete({ tecnico_id: usuarioId });
    return { tecnico_id: usuarioId, eliminado: true };
  }

  private normalizarSlot(slot: SlotDisponibilidadDto) {
    const horas = (valor: string) => (valor.length === 5 ? `${valor}:00` : valor);
    const inicio = horas(slot.hora_inicio);
    const fin = horas(slot.hora_fin);
    if (fin <= inicio) {
      throw new BadRequestException('hora_fin debe ser posterior a hora_inicio');
    }
    return { dia_semana: slot.dia_semana, hora_inicio: inicio, hora_fin: fin };
  }
}