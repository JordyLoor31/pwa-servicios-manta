import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasServicioController } from './controllers/categorias-servicio.controller';
import { TarifasCategoriaController } from './controllers/tarifas-categoria.controller';
import { CategoriasServicioService } from './services/categorias-servicio.service';
import { TarifasCategoriaService } from './services/tarifas-categoria.service';
import { CategoriaServicio } from './entities/categoria-servicio.entity';
import { TarifaCategoria } from './entities/tarifa-categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaServicio, TarifaCategoria])],
  controllers: [
    CategoriasServicioController,
    TarifasCategoriaController,
  ],
  providers: [CategoriasServicioService, TarifasCategoriaService]
})
export class CategoriasModule {}