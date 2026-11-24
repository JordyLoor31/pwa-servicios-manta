import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { TarifaTecnico } from '../entities/tarifa-tecnico.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { TarifaTecnicoDto } from '../dtos/reemplazar-tarifas.dto';
import { asegurarPerfil } from './perfiles-tecnico.helpers';

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
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    return this.tarifasRepository.find({
      where: { tecnico_id: usuarioId },
      order: { categoria_id: 'ASC' },
    });
  }

  async reemplazarTarifas(usuarioId: string, tarifas: TarifaTecnicoDto[]) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    const unicas: TarifaTecnicoDto[] = [];
    const vistas = new Set<string>();
    for (const tarifa of tarifas) {
      if (!tarifa.tipo_servicio.trim()) {
        throw new BadRequestException('El tipo de servicio es obligatorio en cada categoría');
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
            precio: tarifa.precio,
            unidad_cobro: 'por_visita',
            tipo_servicio: tarifa.tipo_servicio.trim(),
            negociable: tarifa.negociable,
          })),
        );
      }
    });
    return this.obtenerTarifas(usuarioId);
  }

}
