import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('direcciones')
export class Direccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_direcciones_usuario')
  @Column({ type: 'uuid' })
  usuario_id: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 50, nullable: true })
  etiqueta: string | null;

  @Column({ type: 'varchar', length: 255 })
  direccion_texto: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia: string | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  latitud: number;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  longitud: number;

  @Column({ type: 'varchar', length: 80, default: 'Manta' })
  ciudad: string;

  @Column({ type: 'boolean', default: false })
  es_principal: boolean;
}