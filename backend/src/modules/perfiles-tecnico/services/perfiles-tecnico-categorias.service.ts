import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { TecnicoCategoria } from '../entities/tecnico-categoria.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { asegurarPerfil } from './perfiles-tecnico.helpers';

@Injectable()
export class PerfilesTecnicoCategoriasService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(TecnicoCategoria)
    private readonly tecnicoCategoriaRepository: Repository<TecnicoCategoria>,
    @InjectRepository(CategoriaServicio)
    private readonly categoriasRepository: Repository<CategoriaServicio>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerCategorias(usuarioId: string) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
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
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    const unicas = [...new Set(categoriaIds)];
    if (unicas.length > 0) {
      const encontradas = await this.categoriasRepository.count({
        where: { id: In(unicas) },
      });
      if (encontradas !== unicas.length) {
        throw new BadRequestException('Una o más categorías no existen');
      }
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TecnicoCategoria, { tecnico_id: usuarioId });
      if (unicas.length > 0) {
        await manager.insert(
          TecnicoCategoria,
          unicas.map((categoriaId) => ({ tecnico_id: usuarioId, categoria_id: categoriaId })),
        );
      }
    });
    return this.obtenerCategorias(usuarioId);
  }

}
