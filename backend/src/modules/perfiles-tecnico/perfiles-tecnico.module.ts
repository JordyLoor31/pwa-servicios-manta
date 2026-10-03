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
import { PerfilesTecnicoConsultaService } from './services/perfiles-tecnico-consulta.service';
import { PerfilesTecnicoDisponibilidadService } from './services/perfiles-tecnico-disponibilidad.service';
import { PerfilesTecnicoCategoriasService } from './services/perfiles-tecnico-categorias.service';
import { PerfilesTecnicoTarifasService } from './services/perfiles-tecnico-tarifas.service';
import { PerfilesTecnicoCertificacionesService } from './services/perfiles-tecnico-certificaciones.service';
import { ReservaServicio } from '../solicitudes/entities/reserva-servicio.entity';

// ReservaServicio se registra solo para consultas de disponibilidad; no expone entidades propias.

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilTecnico,
      DisponibilidadTecnico,
      CertificacionTecnico,
      TecnicoCategoria,
      TarifaTecnico,
      CategoriaServicio,
      ReservaServicio,
    ]),
  ],
  controllers: [PerfilesTecnicoController],
  providers: [
    PerfilesTecnicoService,
    PerfilesTecnicoConsultaService,
    PerfilesTecnicoDisponibilidadService,
    PerfilesTecnicoCategoriasService,
    PerfilesTecnicoTarifasService,
    PerfilesTecnicoCertificacionesService,
  ],
  exports: [PerfilesTecnicoService],
})
export class PerfilesTecnicoModule {}