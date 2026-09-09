import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Direccion } from './entities/direccion.entity';
import { DireccionesController } from './controllers/direcciones.controller';
import { DireccionesService } from './services/direcciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Direccion])],
  controllers: [DireccionesController],
  providers: [DireccionesService],
  exports: [DireccionesService],
})
export class DireccionesModule {}