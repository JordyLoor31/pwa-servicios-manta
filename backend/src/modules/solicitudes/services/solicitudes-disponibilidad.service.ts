import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DisponibilidadTecnico } from '../../perfiles-tecnico/entities/disponibilidad-tecnico.entity';
import { ReservaServicio } from '../entities/reserva-servicio.entity';

@Injectable()
export class SolicitudesDisponibilidadService {
  constructor(
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    @InjectRepository(ReservaServicio)
    private readonly reservasRepository: Repository<ReservaServicio>,
  ) {}

  async reservar(
    manager: EntityManager,
    tecnicoId: string,
    solicitudId: string,
    fecha: string,
    inicio: string,
    fin: string,
  ) {
    this.validarFechaServicio(fecha);
    await this.validarEnDisponibilidad(tecnicoId, fecha, inicio, fin, manager);

    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [`${tecnicoId}:${fecha}`],
    );
    const reservaRepository = manager.getRepository(ReservaServicio);
    const reservas = await reservaRepository
      .createQueryBuilder('r')
      .setLock('pessimistic_write')
      .where('r.tecnico_id = :tecnicoId', { tecnicoId })
      .andWhere('r.fecha_servicio = :fecha', { fecha })
      .andWhere('r.hora_inicio < :fin', { fin })
      .andWhere('r.hora_fin > :inicio', { inicio })
      .getMany();

    if (reservas.length > 0) {
      throw new ConflictException('El técnico ya tiene un servicio reservado en ese horario');
    }

    await reservaRepository.save({
      tecnico_id: tecnicoId,
      solicitud_id: solicitudId,
      fecha_servicio: fecha,
      hora_inicio: inicio,
      hora_fin: fin,
    });
  }

  async liberarReserva(solicitudId: string, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(ReservaServicio)
      : this.reservasRepository;
    await repository.delete({ solicitud_id: solicitudId });
  }

  sumarHoras(hora: string, horas: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + horas * 60;
    if (total > 24 * 60 - 1) {
      throw new BadRequestException('La duración supera el final del día');
    }
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private validarFechaServicio(fecha: string) {
    const hoy = new Date();
    const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
      hoy.getDate(),
    ).padStart(2, '0')}`;
    if (fecha < hoyTexto) {
      throw new BadRequestException('La fecha del servicio no puede ser anterior a hoy');
    }
  }

  private async validarEnDisponibilidad(
    tecnicoId: string,
    fecha: string,
    inicio: string,
    fin: string,
    manager?: EntityManager,
  ) {
    const repository = manager
      ? manager.getRepository(DisponibilidadTecnico)
      : this.disponibilidadRepository;
    const dia = new Date(`${fecha}T12:00:00`).getDay();
    const filas = await repository.find({ where: { tecnico_id: tecnicoId, dia_semana: dia } });
    const dentro = filas.some(
      (fila) =>
        this.minutos(fila.hora_inicio) <= this.minutos(inicio) &&
        this.minutos(fila.hora_fin) >= this.minutos(fin),
    );
    if (!dentro) {
      throw new BadRequestException(
        'El horario elegido supera la disponibilidad semanal del técnico para ese día',
      );
    }
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m ?? 0);
  }

  async bloquearTecnicoPorDia(tecnicoId: string, fecha: Date) {
    const fechaTexto = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
      fecha.getDate(),
    ).padStart(2, '0')}`;
    await this.reservasRepository.delete({ tecnico_id: tecnicoId, fecha_servicio: fechaTexto });
    await this.reservasRepository.save({
      tecnico_id: tecnicoId,
      solicitud_id: 'bloqueo-seguridad',
      fecha_servicio: fechaTexto,
      hora_inicio: '00:00',
      hora_fin: '23:59',
    });
  }
}
