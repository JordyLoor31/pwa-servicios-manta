import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PerfilTecnico } from './perfil-tecnico.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';

@Entity('tarifas_tecnico')
@Index('uq_tarifas_tecnico_tipo', ['tecnico_id', 'categoria_id', 'tipo_servicio'], { unique: true })
export class TarifaTecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_tarifas_tecnico_tecnico')
  @Column({ type: 'uuid' })
  tecnico_id: string;

  @Index('idx_tarifas_tecnico_categoria')
  @Column({ type: 'uuid' })
  categoria_id: string;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: {
      to: (value) => value,
      from: (value) => Number(value),
    },
  })
  precio: number;

  @Column({ type: 'varchar', length: 20, default: 'por_visita' })
  unidad_cobro: 'por_visita';

  @Column({ type: 'varchar', length: 80, default: 'Servicio general' })
  tipo_servicio: string;

  @Column({ type: 'boolean', default: true })
  negociable: boolean;

  @ManyToOne(() => PerfilTecnico)
  @JoinColumn({ name: 'tecnico_id' })
  perfil: PerfilTecnico;

  @ManyToOne(() => CategoriaServicio)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaServicio;
}