import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('suscripciones_push')
@Unique(['usuario_id', 'endpoint'])
export class SuscripcionPush {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth_key: string;

  @CreateDateColumn()
  creada_at: Date;
}