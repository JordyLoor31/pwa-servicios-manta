import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PerfilTecnico } from './perfil-tecnico.entity';

@Entity('disponibilidad_tecnico')
@Check('"dia_semana" BETWEEN 0 AND 6')
export class DisponibilidadTecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tecnico_id: string;

  @ManyToOne(() => PerfilTecnico, (perfil) => perfil.disponibilidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tecnico_id' })
  perfil: PerfilTecnico;

  @Column({ type: 'smallint' })
  dia_semana: number;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}