import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateTarifaCategoriaDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  @IsOptional()
  precio_base?: number;

  @IsIn(['por_hora', 'por_servicio'])
  @IsOptional()
  unidad_cobro?: 'por_hora' | 'por_servicio';
}