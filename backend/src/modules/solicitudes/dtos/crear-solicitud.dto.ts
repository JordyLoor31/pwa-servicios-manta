import {
  IsDateString,
  IsIn,
  IsArray,
  IsNumber,
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
  @IsNumber()
  direccion_latitud?: number;

  @IsOptional()
  @IsNumber()
  direccion_longitud?: number;

  @IsOptional()
  @IsDateString()
  fecha_propuesta?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  hora_propuesta?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  categoria_ids: string[];

  @IsNumber()
  @IsOptional()
  @IsIn([30, 60])
  duracion_oferta_minutos?: 30 | 60;
}