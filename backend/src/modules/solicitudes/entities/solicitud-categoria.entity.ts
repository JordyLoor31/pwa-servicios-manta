import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';
import { Solicitud } from './solicitud.entity';

@Entity('solicitudes_categorias')
@Unique('uq_solicitud_categoria', ['solicitud_id', 'categoria_id'])
export class SolicitudCategoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_solicitudes_categorias_solicitud')
  @Column({ type: 'uuid' })
  solicitud_id: string;

  @Index('idx_solicitudes_categorias_categoria')
  @Column({ type: 'uuid' })
  categoria_id: string;

  @ManyToOne(() => Solicitud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Solicitud;

  @ManyToOne(() => CategoriaServicio)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaServicio;
}
