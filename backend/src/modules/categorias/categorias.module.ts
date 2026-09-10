import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasServicioController } from './controllers/categorias-servicio.controller';
import { CategoriasServicioService } from './services/categorias-servicio.service';
import { CategoriaServicio } from './entities/categoria-servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaServicio])],
  controllers: [CategoriasServicioController],
  providers: [CategoriasServicioService]
})
export class CategoriasModule {}