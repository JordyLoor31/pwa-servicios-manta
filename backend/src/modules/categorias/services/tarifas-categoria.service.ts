import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarifaCategoria } from '../entities/tarifa-categoria.entity';
import { CategoriaServicio } from '../entities/categoria-servicio.entity';
import { CreateTarifaCategoriaDto } from '../dtos/create-tarifa-categoria.dto';
import { UpdateTarifaCategoriaDto } from '../dtos/update-tarifa-categoria.dto';

@Injectable()
export class TarifasCategoriaService {
  constructor(
    @InjectRepository(TarifaCategoria)
    private readonly tarifasRepository: Repository<TarifaCategoria>,
  ) {}

  async create(dto: CreateTarifaCategoriaDto) {
    try {
      const entidad = this.tarifasRepository.create(dto);
      return await this.tarifasRepository.save(entidad);
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('La categoría ya tiene una tarifa asignada');
      }
      if ((error as { code?: string })?.code === '23503') {
        throw new BadRequestException('La categoría de servicio no existe');
      }
      throw error;
    }
  }

  async findAll() {
    return this.tarifasRepository.find({ order: { categoria_id: 'ASC' } });
  }

  async findAllAdmin() {
    const filas = await this.tarifasRepository
      .createQueryBuilder('t')
      .innerJoin(CategoriaServicio, 'c', 'c.id = t.categoria_id')
      .select([
        't.id AS id',
        't.categoria_id AS categoria_id',
        't.precio_base AS precio_base',
        't.unidad_cobro AS unidad_cobro',
        't.fecha_actualizacion AS fecha_actualizacion',
        'c.nombre AS categoria_nombre',
        'c.icono AS categoria_icono',
        'c.activa AS categoria_activa',
      ])
      .orderBy('c.nombre', 'ASC')
      .getRawMany();
    return filas.map((fila) => ({
      ...fila,
      precio_base: Number(fila.precio_base),
    }));
  }

  async findOne(id: string) {
    const tarifa = await this.tarifasRepository.findOneBy({ id });
    if (!tarifa) {
      throw new NotFoundException(`Tarifa ${id} no encontrada`);
    }
    return tarifa;
  }

  async findByCategoria(categoriaId: string) {
    const tarifa = await this.tarifasRepository.findOneBy({ categoria_id: categoriaId });
    if (!tarifa) {
      throw new NotFoundException(`La categoría ${categoriaId} no tiene tarifa asignada`);
    }
    return tarifa;
  }

  async update(id: string, dto: UpdateTarifaCategoriaDto) {
    await this.findOne(id);
    await this.tarifasRepository.update({ id }, { ...dto, fecha_actualizacion: new Date() });
    return this.findOne(id);
  }

  async remove(id: string) {
    const tarifa = await this.findOne(id);
    await this.tarifasRepository.remove(tarifa);
    return { id, eliminado: true };
  }
}