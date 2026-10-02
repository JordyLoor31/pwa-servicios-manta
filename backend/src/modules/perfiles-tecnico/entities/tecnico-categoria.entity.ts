import { Entity, Index, PrimaryColumn } from 'typeorm';

@Index('idx_tecnico_categoria_categoria', ['categoria_id'])
@Entity('tecnico_categoria')
export class TecnicoCategoria {
  @PrimaryColumn({ type: 'uuid' })
  tecnico_id: string;

  @PrimaryColumn({ type: 'uuid' })
  categoria_id: string;
}