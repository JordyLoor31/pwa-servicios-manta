import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from '../entities/disponibilidad-tecnico.entity';
import { TecnicoCategoria } from '../entities/tecnico-categoria.entity';
import { Usuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { ReservaServicio } from '../../solicitudes/entities/reserva-servicio.entity'; // solo lectura para disponibilidad
import { SlotDisponibilidadDto } from '../dtos/reemplazar-disponibilidad.dto';
import { asegurarPerfil, toDirectorio } from './perfiles-tecnico.helpers';

function agregarSlotsDisponibles(inicio: string, fin: string, slots: Set<string>): void {
  const convertir = minutosDeHora;
  const formatear = (minutos: number): string => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const finMin = convertir(fin);
  for (let t = convertir(inicio); t + 30 <= finMin; t += 30) {
    slots.add(formatear(t));
  }
}

function minutosDeHora(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

@Injectable()
export class PerfilesTecnicoDisponibilidadService {
  constructor(
    @InjectRepository(PerfilTecnico)
    private readonly perfilesRepository: Repository<PerfilTecnico>,
    @InjectRepository(DisponibilidadTecnico)
    private readonly disponibilidadRepository: Repository<DisponibilidadTecnico>,
    @InjectRepository(TecnicoCategoria)
    private readonly tecnicoCategoriaRepository: Repository<TecnicoCategoria>,
    @InjectRepository(ReservaServicio)
    private readonly reservasRepository: Repository<ReservaServicio>,
    private readonly dataSource: DataSource,
  ) {}

  async disponiblesPublic(dia: number, hora: string, categorias: string[] = []) {
    const query = this.crearQueryDisponibles({ dia, hora, categorias });
    const filas = await query
      .orderBy('p.calificacion_promedio', 'DESC')
      .addOrderBy('u.nombres', 'ASC')
      .getRawMany<{
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        verificado: boolean;
        calificacion_promedio: string | number;
        total_servicios_completados: string | number;
      }>();
    return toDirectorio(filas);
  }

  async disponiblesPorDia(dia: number, categorias: string[] = []) {
    const query = this.crearQueryDisponibles({ dia, categorias, distinct: true });
    const filas = await query
      .orderBy('p.calificacion_promedio', 'DESC')
      .addOrderBy('u.nombres', 'ASC')
      .getRawMany<{
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        verificado: boolean;
        calificacion_promedio: string | number;
        total_servicios_completados: string | number;
      }>();
    return toDirectorio(filas);
  }

  async disponiblesPorFecha(fecha: string, categorias: string[] = [], tecnicoId?: string) {
    const dia = new Date(`${fecha}T12:00:00`).getDay();
    const query = this.crearQueryDisponibles({ dia, categorias, tecnicoId, distinct: true });
    const filas = await query
      .orderBy('p.calificacion_promedio', 'DESC')
      .addOrderBy('u.nombres', 'ASC')
      .getRawMany<{
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        verificado: boolean;
        calificacion_promedio: string | number;
        total_servicios_completados: string | number;
      }>();
    if (filas.length === 0) {
      return [];
    }
    const ids = filas.map((fila) => fila.id);
    const intervalos = await this.disponibilidadRepository.find({
      where: { tecnico_id: In(ids), dia_semana: dia },
      select: { tecnico_id: true, hora_inicio: true, hora_fin: true },
    });
    const reservas = await this.reservasRepository.find({
      where: { tecnico_id: In(ids), fecha_servicio: fecha },
      select: { tecnico_id: true, hora_inicio: true, hora_fin: true },
    });
    const intervalosPorTecnico = new Map<string, { inicio: string; fin: string }[]>();
    for (const intervalo of intervalos) {
      const lista = intervalosPorTecnico.get(intervalo.tecnico_id) ?? [];
      lista.push({ inicio: intervalo.hora_inicio, fin: intervalo.hora_fin });
      intervalosPorTecnico.set(intervalo.tecnico_id, lista);
    }
    const reservasPorTecnico = new Map<string, { inicio: string; fin: string }[]>();
    for (const reserva of reservas) {
      const lista = reservasPorTecnico.get(reserva.tecnico_id) ?? [];
      lista.push({ inicio: reserva.hora_inicio, fin: reserva.hora_fin });
      reservasPorTecnico.set(reserva.tecnico_id, lista);
    }
    const filasConSlots = filas.filter((fila) => {
      const intervalosTecnico = intervalosPorTecnico.get(fila.id) ?? [];
      const reservasTecnico = reservasPorTecnico.get(fila.id) ?? [];
      return intervalosTecnico.some((intervalo) => {
        const slots = new Set<string>();
        agregarSlotsDisponibles(intervalo.inicio, intervalo.fin, slots);
        return [...slots].some((slot) => {
          const inicio = minutosDeHora(slot);
          const fin = inicio + 30;
          return !reservasTecnico.some(
            (reserva) => minutosDeHora(reserva.inicio) < fin && minutosDeHora(reserva.fin) > inicio,
          );
        });
      });
    });
    return toDirectorio(filasConSlots);
  }

  async horariosDisponibles(dia: number, categorias: string[] = [], tecnicoId?: string) {
    const query = this.disponibilidadRepository
      .createQueryBuilder('d')
      .innerJoin(PerfilTecnico, 'p', 'p.usuario_id = d.tecnico_id')
      .innerJoin(
        Usuario,
        'u',
        'u.id = d.tecnico_id AND u.estado = :activo',
        { activo: EstadoUsuario.ACTIVO },
      )
      .select('d.hora_inicio', 'inicio')
      .addSelect('d.hora_fin', 'fin')
      .where('d.dia_semana = :dia', { dia });

    if (tecnicoId) {
      query.andWhere('d.tecnico_id = :tecnicoId', { tecnicoId });
    }

    if (categorias.length > 0) {
      query
        .innerJoin(TecnicoCategoria, 'tc', 'tc.tecnico_id = d.tecnico_id')
        .andWhere('tc.categoria_id IN (:...ids)', { ids: [...new Set(categorias)] });
    }

    const filas = await query.getRawMany<{ inicio: string; fin: string }>();
    const slots = new Set<string>();
    for (const fila of filas) {
      agregarSlotsDisponibles(fila.inicio, fila.fin, slots);
    }
    return [...slots].sort();
  }

  async horariosDisponiblesPorFecha(
    fecha: string,
    tecnicoId: string,
    categorias: string[] = [],
  ) {
    const dia = new Date(`${fecha}T12:00:00`).getDay();
    const horarios = await this.horariosDisponibles(dia, categorias, tecnicoId);
    const reservas = await this.reservasRepository.find({
      where: { tecnico_id: tecnicoId, fecha_servicio: fecha },
      select: { hora_inicio: true, hora_fin: true },
    });

    const convertir = minutosDeHora;
    return horarios.filter((hora) => {
      const inicio = convertir(hora);
      const fin = inicio + 30;
      return !reservas.some(
        (reserva) => convertir(reserva.hora_inicio) < fin && convertir(reserva.hora_fin) > inicio,
      );
    });
  }

  async obtenerDisponibilidad(usuarioId: string) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    return this.disponibilidadRepository.find({
      where: { tecnico_id: usuarioId },
      order: { dia_semana: 'ASC', hora_inicio: 'ASC' },
    });
  }

  async reemplazarDisponibilidad(usuarioId: string, slots: SlotDisponibilidadDto[]) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    const normalizados = slots.map((slot) => this.normalizarSlot(slot));
    normalizados.sort(
      (a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio),
    );
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(DisponibilidadTecnico, { tecnico_id: usuarioId });
      if (normalizados.length > 0) {
        await manager.insert(
          DisponibilidadTecnico,
          normalizados.map((slot) => ({ tecnico_id: usuarioId, ...slot })),
        );
      }
    });
    return this.obtenerDisponibilidad(usuarioId);
  }

  async eliminarDisponibilidad(usuarioId: string) {
    await asegurarPerfil(this.perfilesRepository, usuarioId);
    await this.disponibilidadRepository.delete({ tecnico_id: usuarioId });
    return { tecnico_id: usuarioId, eliminado: true };
  }

  private normalizarSlot(slot: SlotDisponibilidadDto) {
    const horas = (valor: string) => (valor.length === 5 ? `${valor}:00` : valor);
    const inicio = horas(slot.hora_inicio);
    const fin = horas(slot.hora_fin);
    if (fin <= inicio) {
      throw new BadRequestException('hora_fin debe ser posterior a hora_inicio');
    }
    return { dia_semana: slot.dia_semana, hora_inicio: inicio, hora_fin: fin };
  }

  private crearQueryDisponibles(opciones: {
    dia: number;
    hora?: string;
    categorias?: string[];
    tecnicoId?: string;
    distinct?: boolean;
  }) {
    const { dia, hora, categorias = [], tecnicoId, distinct = false } = opciones;
    const query = this.perfilesRepository
      .createQueryBuilder('p')
      .innerJoin(Usuario, 'u', 'u.id = p.usuario_id')
      .innerJoin(
        DisponibilidadTecnico,
        'd',
        'd.tecnico_id = p.usuario_id AND d.dia_semana = :dia',
        { dia },
      )
      .select([
        'u.id AS id',
        'u.nombres AS nombres',
        'u.apellidos AS apellidos',
        'u.email AS email',
        'p.verificado AS verificado',
        'p.calificacion_promedio AS calificacion_promedio',
        'p.total_servicios_completados AS total_servicios_completados',
      ])
      .where('u.estado = :activo', { activo: EstadoUsuario.ACTIVO });

    if (distinct) {
      query.distinct(true);
    }

    if (hora !== undefined) {
      query.andWhere('d.hora_inicio <= :hora', { hora }).andWhere('d.hora_fin > :hora', { hora });
    }

    if (tecnicoId) {
      query.andWhere('p.usuario_id = :tecnicoId', { tecnicoId });
    }

    if (categorias.length > 0) {
      query
        .innerJoin(TecnicoCategoria, 'tc', 'tc.tecnico_id = p.usuario_id')
        .andWhere('tc.categoria_id IN (:...ids)', { ids: [...new Set(categorias)] });
    }

    return query;
  }

}
