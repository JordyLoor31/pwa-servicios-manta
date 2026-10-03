import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada',
}

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_solicitudes_cliente')
  @Column({ type: 'uuid' })
  cliente_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Usuario;

  @Index('idx_solicitudes_tecnico')
  @Column({ type: 'uuid' })
  tecnico_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'tecnico_id' })
  tecnico: Usuario;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_propuesta: string | null;

  @Column({ type: 'time', nullable: true })
  hora_propuesta: string | null;

  @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_aceptacion: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_completada: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_solicitud: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}