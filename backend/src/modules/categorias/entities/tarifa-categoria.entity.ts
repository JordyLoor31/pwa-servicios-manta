import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tarifas_categoria')
export class TarifaCategoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  categoria_id: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, transformer: { to: (v) => v, from: (v) => Number(v) } })
  precio_base: number;

  @Column({ type: 'varchar', length: 20, default: 'por_servicio' })
  unidad_cobro: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha_actualizacion: Date;
}