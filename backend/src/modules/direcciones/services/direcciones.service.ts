import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Direccion } from '../entities/direccion.entity';
import { CreateDireccionDto } from '../dtos/create-direccion.dto';
import { UpdateDireccionDto } from '../dtos/update-direccion.dto';

@Injectable()
export class DireccionesService {
  constructor(
    @InjectRepository(Direccion)
    private readonly direccionesRepository: Repository<Direccion>,
    private readonly dataSource: DataSource,
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
    return this.dataSource.transaction(async (manager) => {
      if (dto.es_principal) {
        await this.quitarPrincipal(usuarioId, manager);
      }
      const direccion = manager.create(Direccion, {
        usuario_id: usuarioId,
        etiqueta: dto.etiqueta ?? null,
        direccion_texto: dto.direccion_texto,
        referencia: dto.referencia ?? null,
        latitud: dto.latitud,
        longitud: dto.longitud,
        ciudad: dto.ciudad ?? 'Manta',
        es_principal: dto.es_principal ?? false,
      });
      return manager.save(Direccion, direccion);
    });
  }

  async update(usuarioId: string, id: string, dto: UpdateDireccionDto) {
    const direccion = await this.findOne(usuarioId, id);
    return this.dataSource.transaction(async (manager) => {
      if (dto.es_principal === true && !direccion.es_principal) {
        await this.quitarPrincipal(usuarioId, manager);
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
      return manager.save(Direccion, direccion);
    });
  }

  async setPrincipal(usuarioId: string, id: string) {
    const direccion = await this.findOne(usuarioId, id);
    return this.dataSource.transaction(async (manager) => {
      await this.quitarPrincipal(usuarioId, manager);
      direccion.es_principal = true;
      return manager.save(Direccion, direccion);
    });
  }

  async remove(usuarioId: string, id: string) {
    const direccion = await this.findOne(usuarioId, id);
    await this.direccionesRepository.remove(direccion);
    return { eliminada: true };
  }

  private async quitarPrincipal(usuarioId: string, manager = this.dataSource.manager) {
    await manager.update(
      Direccion,
      { usuario_id: usuarioId, es_principal: true },
      { es_principal: false },
    );
  }
}