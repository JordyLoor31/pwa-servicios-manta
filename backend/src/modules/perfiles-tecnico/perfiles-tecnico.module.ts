import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilTecnico } from './entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from './entities/disponibilidad-tecnico.entity';
import { CertificacionTecnico } from './entities/certificacion-tecnico.entity';
import { TecnicoCategoria } from './entities/tecnico-categoria.entity';
import { TarifaTecnico } from './entities/tarifa-tecnico.entity';
import { CategoriaServicio } from '../categorias/entities/categoria-servicio.entity';
import { PerfilesTecnicoController } from './controllers/perfiles-tecnico.controller';
import { PerfilesTecnicoService } from './services/perfiles-tecnico.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilTecnico,
      DisponibilidadTecnico,
      CertificacionTecnico,
      TecnicoCategoria,
      TarifaTecnico,
      CategoriaServicio,
    ]),
  ],
  controllers: [PerfilesTecnicoController],
  providers: [PerfilesTecnicoService],
  exports: [PerfilesTecnicoService],
})
export class PerfilesTecnicoModule {}