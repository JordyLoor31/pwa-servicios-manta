import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class RangoPrecioDto {
  @IsUUID()
  categoria_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  precio_min: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  precio_max: number;
}

export class ReemplazarTarifasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RangoPrecioDto)
  tarifas: RangoPrecioDto[];
}