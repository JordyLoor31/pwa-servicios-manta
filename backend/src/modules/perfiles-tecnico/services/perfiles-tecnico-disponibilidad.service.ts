import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';
import { DisponibilidadTecnico } from '../entities/disponibilidad-tecnico.entity';
import { TecnicoCategoria } from '../entities/tecnico-categoria.entity';
import { Usuario, EstadoUsuario } from '../../usuarios/entities/usuario.entity';
import { ReservaServicio } from '../../solicitudes/entities/reserva-servicio.entity';
import { SlotDisponibilidadDto } from '../dtos/reemplazar-disponibilidad.dto';

function agregarSlotsDisponibles(inicio: string, fin: string, slots: Set<string>): void {
  const convertir = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };
  const formatear = (minutos: number): string => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const finMin = convertir(fin);
  for (let t = convertir(inicio); t < finMin; t += 30) {
    slots.add(formatear(t));
  }
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
    return this.toDirectorio(filas);
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
    return this.toDirectorio(filas);
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
    return this.toDirectorio(filas);
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

    const minutos = (hora: string) => {
      const [horas, minutos] = hora.split(':').map(Number);
      return horas * 60 + minutos;
    };
    return horarios.filter((hora) => {
      const inicio = minutos(hora);
      const fin = inicio + 30;
      return !reservas.some(
        (reserva) => minutos(reserva.hora_inicio) < fin && minutos(reserva.hora_fin) > inicio,
      );
    });
  }

  async obtenerDisponibilidad(usuarioId: string) {
    await this.asegurarPerfil(usuarioId);
    return this.disponibilidadRepository.find({
      where: { tecnico_id: usuarioId },
      order: { dia_semana: 'ASC', hora_inicio: 'ASC' },
    });
  }

  async reemplazarDisponibilidad(usuarioId: string, slots: SlotDisponibilidadDto[]) {
    await this.asegurarPerfil(usuarioId);
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
    await this.asegurarPerfil(usuarioId);
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

  private toDirectorio(
    filas: {
      id: string;
      nombres: string;
      apellidos: string;
      email: string;
      verificado: boolean;
      calificacion_promedio: string | number;
      total_servicios_completados: string | number;
    }[],
  ) {
    return filas.map((fila) => ({
      ...fila,
      calificacion_promedio: Number(fila.calificacion_promedio ?? 0),
      total_servicios_completados: Number(fila.total_servicios_completados ?? 0),
    }));
  }

  private async asegurarPerfil(usuarioId: string) {
    const perfil = await this.perfilesRepository.findOneBy({ usuario_id: usuarioId });
    if (!perfil) {
      throw new NotFoundException(`Perfil técnico del usuario ${usuarioId} no encontrado`);
    }
    return perfil;
  }
}
