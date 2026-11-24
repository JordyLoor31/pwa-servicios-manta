import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CrearPostulacionDto {
  @IsOptional()
  @IsUUID()
  tarifa_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensaje?: string;
}
