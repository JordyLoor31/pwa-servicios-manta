import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PerfilTecnico } from './perfil-tecnico.entity';
import { CategoriaServicio } from '../../categorias/entities/categoria-servicio.entity';

@Entity('tarifas_tecnico')
@Check('CHK_tarifas_tecnico_rango', '"precio_max" >= "precio_min"')
export class TarifaTecnico {
  @PrimaryColumn({ type: 'uuid' })
  tecnico_id: string;

  @PrimaryColumn({ type: 'uuid' })
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
  precio_min: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: {
      to: (value) => value,
      from: (value) => Number(value),
    },
  })
  precio_max: number;

  @Column({ type: 'varchar', length: 20, default: 'por_servicio' })
  unidad_cobro: 'por_hora' | 'por_servicio';

  @ManyToOne(() => PerfilTecnico)
  @JoinColumn({ name: 'tecnico_id' })
  perfil: PerfilTecnico;

  @ManyToOne(() => CategoriaServicio)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaServicio;
}