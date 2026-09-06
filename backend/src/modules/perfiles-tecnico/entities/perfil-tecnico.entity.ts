import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('perfiles_tecnico')
export class PerfilTecnico {
  @PrimaryColumn({ type: 'uuid' })
  usuario_id: string;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'text', nullable: true })
  biografia: string;

  @Column({ type: 'smallint', nullable: true })
  anios_experiencia: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  radio_cobertura_km: string;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_verificacion: Date;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  calificacion_promedio: string;

  @Column({ type: 'int', default: 0 })
  total_servicios_completados: number;
}