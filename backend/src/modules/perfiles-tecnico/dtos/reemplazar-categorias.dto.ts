import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReemplazarCategoriasDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  categoria_ids: string[];
}