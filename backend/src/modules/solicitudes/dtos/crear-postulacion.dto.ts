import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearPostulacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensaje?: string;
}
