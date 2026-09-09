import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDireccionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  etiqueta?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion_texto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencia?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ciudad?: string;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}