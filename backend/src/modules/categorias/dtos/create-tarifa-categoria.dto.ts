import { IsIn, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateTarifaCategoriaDto {
  @IsUUID()
  categoria_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  precio_base: number;

  @IsIn(['por_hora', 'por_servicio'])
  @IsOptional()
  unidad_cobro?: 'por_hora' | 'por_servicio';
}