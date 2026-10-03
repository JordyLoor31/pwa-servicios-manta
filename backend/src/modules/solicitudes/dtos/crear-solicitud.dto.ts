import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearSolicitudDto {
  @IsUUID()
  @IsOptional()
  tecnico_id?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descripcion: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @IsOptional()
  @IsDateString()
  fecha_propuesta?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  hora_propuesta?: string;
}