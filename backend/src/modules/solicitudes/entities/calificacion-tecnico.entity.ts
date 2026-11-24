import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Solicitud } from './solicitud.entity';

@Entity('calificaciones_tecnico')
@Unique('uq_calificacion_solicitud', ['solicitud_id'])
@Check('CHK_calificaciones_tecnico_rango', '"calificacion" BETWEEN 1 AND 5')
@Check(
  'CHK_calificaciones_tecnico_comentario',
  '"comentario" IS NULL OR char_length("comentario") <= 1000',
)
export class CalificacionTecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitud_id: string;

  @OneToOne(() => Solicitud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Solicitud;

  @Index('idx_calificaciones_cliente')
  @Column({ type: 'uuid' })
  cliente_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Usuario;

  @Index('idx_calificaciones_tecnico')
  @Column({ type: 'uuid' })
  tecnico_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'tecnico_id' })
  tecnico: Usuario;

  @Index('idx_calificaciones_categoria')
  @Column({ type: 'uuid', nullable: true })
  categoria_id: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  tipo_servicio: string | null;

  @Column({ type: 'smallint' })
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}
