import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaServicio } from './entities/reserva-servicio.entity';
import { ReservasConsultaService } from './services/reservas-consulta.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReservaServicio])],
  providers: [ReservasConsultaService],
  exports: [ReservasConsultaService],
})
export class ReservasModule {}
