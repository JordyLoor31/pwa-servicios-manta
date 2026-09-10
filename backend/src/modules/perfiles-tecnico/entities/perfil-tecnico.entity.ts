import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { DisponibilidadTecnico } from './disponibilidad-tecnico.entity';
import { CertificacionTecnico } from './certificacion-tecnico.entity';

@Entity('perfiles_tecnico')
export class PerfilTecnico {
  @PrimaryColumn({ type: 'uuid' })
  usuario_id: string;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => DisponibilidadTecnico, (disponibilidad) => disponibilidad.perfil)
  disponibilidad: DisponibilidadTecnico[];

  @OneToMany(() => CertificacionTecnico, (certificacion) => certificacion.perfil)
  certificaciones: CertificacionTecnico[];

  @Column({ type: 'text', nullable: true })
  biografia: string | null;

  @Column({ type: 'smallint', nullable: true })
  anios_experiencia: number | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value) => value,
      from: (value) => (value === null ? null : Number(value)),
    },
  })
  radio_cobertura_km: number | null;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_verificacion: Date | null;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: {
      to: (value) => value,
      from: (value) => Number(value),
    },
  })
  calificacion_promedio: number;

  @Column({ type: 'int', default: 0 })
  total_servicios_completados: number;
}