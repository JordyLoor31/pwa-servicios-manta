import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ReservaServicio } from '../entities/reserva-servicio.entity';

export interface IntervaloReserva {
  tecnico_id: string;
  hora_inicio: string;
  hora_fin: string;
}

@Injectable()
export class ReservasConsultaService {
  constructor(
    @InjectRepository(ReservaServicio)
    private readonly reservasRepository: Repository<ReservaServicio>,
  ) {}

  buscarPorTecnicosYFecha(tecnicoIds: string[], fecha: string) {
    if (tecnicoIds.length === 0) {
      return Promise.resolve<IntervaloReserva[]>([]);
    }
    return this.reservasRepository.find({
      where: { tecnico_id: In(tecnicoIds), fecha_servicio: fecha },
      select: { tecnico_id: true, hora_inicio: true, hora_fin: true },
    });
  }

  buscarPorTecnicoYFecha(tecnicoId: string, fecha: string) {
    return this.reservasRepository.find({
      where: { tecnico_id: tecnicoId, fecha_servicio: fecha },
      select: { tecnico_id: true, hora_inicio: true, hora_fin: true },
    });
  }
}
