import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reservas_servicio')
export class ReservaServicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_reservas_tecnico_fecha')
  @Column({ type: 'uuid' })
  tecnico_id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Column({ type: 'date' })
  fecha_servicio: string;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}