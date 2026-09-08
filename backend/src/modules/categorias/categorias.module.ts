import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasController } from './controllers/categorias.controller';
import { CategoriasServicioController } from './controllers/categorias-servicio.controller';
import { TarifasCategoriaController } from './controllers/tarifas-categoria.controller';
import { CategoriasService } from './services/categorias.service';
import { CategoriasServicioService } from './services/categorias-servicio.service';
import { TarifasCategoriaService } from './services/tarifas-categoria.service';
import { Categoria } from './entities/categoria.entity';
import { CategoriaServicio } from './entities/categoria-servicio.entity';
import { TarifaCategoria } from './entities/tarifa-categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, CategoriaServicio, TarifaCategoria])],
  controllers: [
    CategoriasController,
    CategoriasServicioController,
    TarifasCategoriaController,
  ],
  providers: [CategoriasService, CategoriasServicioService, TarifasCategoriaService]
})
export class CategoriasModule {}