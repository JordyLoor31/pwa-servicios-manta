import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePerfilTecnicoDto {
  @IsString()
  @IsOptional()
  biografia?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  anios_experiencia?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  @IsOptional()
  radio_cobertura_km?: number;
}