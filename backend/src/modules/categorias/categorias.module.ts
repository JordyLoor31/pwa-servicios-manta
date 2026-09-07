import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasController } from './controllers/categorias.controller';
import { CategoriasServicioController } from './controllers/categorias-servicio.controller';
import { CategoriasService } from './services/categorias.service';
import { CategoriasServicioService } from './services/categorias-servicio.service';
import { Categoria } from './entities/categoria.entity';
import { CategoriaServicio } from './entities/categoria-servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, CategoriaServicio])],
  controllers: [CategoriasController, CategoriasServicioController],
  providers: [CategoriasService, CategoriasServicioService]
})
export class CategoriasModule {}
