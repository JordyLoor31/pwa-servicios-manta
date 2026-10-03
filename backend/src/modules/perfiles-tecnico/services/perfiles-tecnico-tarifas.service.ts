import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { TarifaTecnico } from '../entities/tarifa-tecnico.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { RangoPrecioDto } from '../dtos/reemplazar-tarifas.dto';

@Injectable()
export class PerfilesTecnicoTarifasService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(TarifaTecnico)
    private readonly tarifasRepository: Repository<TarifaTecnico>,
    @InjectRepository(CategoriaServicio)
    private readonly categoriasRepository: Repository<CategoriaServicio>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerTarifas(usuarioId: string) {
    await this.asegurarPerfil(usuarioId);
    return this.tarifasRepository.find({
      where: { tecnico_id: usuarioId },
      order: { categoria_id: 'ASC' },
    });
  }

  async reemplazarTarifas(usuarioId: string, tarifas: RangoPrecioDto[]) {
    await this.asegurarPerfil(usuarioId);
    const unicas: RangoPrecioDto[] = [];
    const vistas = new Set<string>();
    for (const tarifa of tarifas) {
      if (tarifa.precio_max < tarifa.precio_min) {
        throw new BadRequestException(
          'precio_max debe ser mayor o igual a precio_min en cada categoría',
        );
      }
      if (!vistas.has(tarifa.categoria_id)) {
        vistas.add(tarifa.categoria_id);
        unicas.push(tarifa);
      }
    }
    if (unicas.length > 0) {
      const encontradas = await this.categoriasRepository.count({
        where: { id: In(unicas.map((t) => t.categoria_id)) },
      });
      if (encontradas !== unicas.length) {
        throw new BadRequestException('Una o más categorías no existen');
      }
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TarifaTecnico, { tecnico_id: usuarioId });
      if (unicas.length > 0) {
        await manager.insert(
          TarifaTecnico,
          unicas.map((tarifa) => ({
            tecnico_id: usuarioId,
            categoria_id: tarifa.categoria_id,
            precio_min: tarifa.precio_min,
            precio_max: tarifa.precio_max,
            unidad_cobro: tarifa.unidad_cobro ?? 'por_servicio',
          })),
        );
      }
    });
    return this.obtenerTarifas(usuarioId);
  }

  private async asegurarPerfil(usuarioId: string) {
    const perfil = await this.perfilesRepository.findOneBy({ usuario_id: usuarioId });
    if (!perfil) {
      throw new NotFoundException(`Perfil técnico del usuario ${usuarioId} no encontrado`);
    }
    return perfil;
  }
}
