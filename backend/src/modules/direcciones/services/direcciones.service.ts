import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Direccion } from '../entities/direccion.entity';
import { CreateDireccionDto } from '../dtos/create-direccion.dto';
import { UpdateDireccionDto } from '../dtos/update-direccion.dto';

@Injectable()
export class DireccionesService {
  constructor(
    @InjectRepository(Direccion)
    private readonly direccionesRepository: Repository<Direccion>,
  ) {}

  async findAll(usuarioId: string) {
    return this.direccionesRepository.find({
      where: { usuario_id: usuarioId },
      order: { es_principal: 'DESC', id: 'ASC' },
    });
  }

  async findOne(usuarioId: string, id: string) {
    const direccion = await this.direccionesRepository.findOneBy({ id, usuario_id: usuarioId });
    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }
    return direccion;
  }

  async create(usuarioId: string, dto: CreateDireccionDto) {
    if (dto.es_principal) {
      await this.quitarPrincipal(usuarioId);
    }
    const direccion = this.direccionesRepository.create({
      usuario_id: usuarioId,
      etiqueta: dto.etiqueta ?? null,
      direccion_texto: dto.direccion_texto,
      referencia: dto.referencia ?? null,
      latitud: dto.latitud,
      longitud: dto.longitud,
      ciudad: dto.ciudad ?? 'Manta',
      es_principal: dto.es_principal ?? false,
    });
    return this.direccionesRepository.save(direccion);
  }

  async update(usuarioId: string, id: string, dto: UpdateDireccionDto) {
    const direccion = await this.findOne(usuarioId, id);
    if (dto.es_principal === true && !direccion.es_principal) {
      await this.quitarPrincipal(usuarioId);
    }
    Object.assign(direccion, {
      ...(dto.etiqueta !== undefined ? { etiqueta: dto.etiqueta } : {}),
      ...(dto.direccion_texto !== undefined ? { direccion_texto: dto.direccion_texto } : {}),
      ...(dto.referencia !== undefined ? { referencia: dto.referencia } : {}),
      ...(dto.latitud !== undefined ? { latitud: dto.latitud } : {}),
      ...(dto.longitud !== undefined ? { longitud: dto.longitud } : {}),
      ...(dto.ciudad !== undefined ? { ciudad: dto.ciudad } : {}),
      ...(dto.es_principal !== undefined ? { es_principal: dto.es_principal } : {}),
    });
    return this.direccionesRepository.save(direccion);
  }

  async setPrincipal(usuarioId: string, id: string) {
    await this.quitarPrincipal(usuarioId);
    const direccion = await this.findOne(usuarioId, id);
    direccion.es_principal = true;
    return this.direccionesRepository.save(direccion);
  }

  async remove(usuarioId: string, id: string) {
    const direccion = await this.findOne(usuarioId, id);
    await this.direccionesRepository.remove(direccion);
    return { eliminada: true };
  }

  private async quitarPrincipal(usuarioId: string) {
    await this.direccionesRepository.update(
      { usuario_id: usuarioId, es_principal: true },
      { es_principal: false },
    );
  }
}