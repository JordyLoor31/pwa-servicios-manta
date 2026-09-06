import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PerfilTecnico } from '../../perfiles-tecnico/entities/perfil-tecnico.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @ManyToMany(() => PerfilTecnico, (perfil) => perfil.categorias)
  tecnicos: PerfilTecnico[];
}