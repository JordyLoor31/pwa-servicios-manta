import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaServicio } from '../entities/categoria-servicio.entity';
import { CreateCategoriaServicioDto } from '../dtos/create-categoria-servicio.dto';
import { UpdateCategoriaServicioDto } from '../dtos/update-categoria-servicio.dto';

@Injectable()
export class CategoriasServicioService {
  constructor(
    @InjectRepository(CategoriaServicio)
    private readonly categoriasRepository: Repository<CategoriaServicio>,
  ) {}

  async create(dto: CreateCategoriaServicioDto) {
    try {
      const entidad = this.categoriasRepository.create(dto);
      return await this.categoriasRepository.save(entidad);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('Ya existe una categoría de servicio con ese nombre');
      }
      throw error;
    }
  }

  async findAll(soloActivas: boolean) {
    return this.categoriasRepository.find({
      where: soloActivas ? { activa: true } : {},
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const categoria = await this.categoriasRepository.findOneBy({ id });
    if (!categoria) {
      throw new NotFoundException(`Categoría de servicio ${id} no encontrada`);
    }
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaServicioDto) {
    await this.findOne(id);
    await this.categoriasRepository.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const categoria = await this.findOne(id);
    await this.categoriasRepository.remove(categoria);
    return { id, eliminado: true };
  }
}