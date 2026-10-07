import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Solicitud } from './solicitud.entity';

export enum EstadoPostulacion {
  PENDIENTE = 'pendiente',
  RECHAZADA = 'rechazada',
  ACEPTADA = 'aceptada',
  CANCELADA = 'cancelada',
}

@Entity('postulaciones_solicitud')
@Unique('uq_postulacion_solicitud_tecnico', ['solicitud_id', 'tecnico_id'])
export class PostulacionSolicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_postulaciones_solicitud')
  @Column({ type: 'uuid' })
  solicitud_id: string;

  @ManyToOne(() => Solicitud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Solicitud;

  @Index('idx_postulaciones_tecnico')
  @Column({ type: 'uuid' })
  tecnico_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'tecnico_id' })
  tecnico: Usuario;

  @Column({ type: 'enum', enum: ['por_hora', 'por_servicio'] })
  unidad_cobro: 'por_hora' | 'por_servicio';

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  precio: number;

  @Column({ type: 'text', nullable: true })
  mensaje: string | null;

  @Column({ type: 'enum', enum: EstadoPostulacion, default: EstadoPostulacion.PENDIENTE })
  estado: EstadoPostulacion;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_postulacion: Date;
}
