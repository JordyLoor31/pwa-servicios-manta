import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categorias_servicio')
export class CategoriaServicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icono: string | null;

  @Column({ type: 'boolean', default: true })
  activa: boolean;
}