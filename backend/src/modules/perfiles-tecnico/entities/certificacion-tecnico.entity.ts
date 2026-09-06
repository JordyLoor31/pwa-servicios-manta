import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PerfilTecnico } from './perfil-tecnico.entity';

export enum EstadoCertificacion {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

@Entity('certificaciones_tecnico')
export class CertificacionTecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tecnico_id: string;

  @ManyToOne(() => PerfilTecnico, (perfil) => perfil.certificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tecnico_id' })
  perfil: PerfilTecnico;

  @Column({ type: 'varchar', length: 100 })
  tipo_documento: string;

  @Column({ type: 'varchar', length: 255 })
  url_documento: string;

  @Column({ type: 'enum', enum: EstadoCertificacion, default: EstadoCertificacion.PENDIENTE })
  estado: EstadoCertificacion;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_revision: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}