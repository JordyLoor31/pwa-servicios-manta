import { Entity, PrimaryColumn } from 'typeorm';

@Entity('tecnico_categoria')
export class TecnicoCategoria {
  @PrimaryColumn({ type: 'uuid' })
  tecnico_id: string;

  @PrimaryColumn({ type: 'uuid' })
  categoria_id: string;
}