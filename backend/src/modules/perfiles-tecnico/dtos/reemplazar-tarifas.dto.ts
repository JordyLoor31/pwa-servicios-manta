import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TarifaTecnicoDto {
  @IsUUID()
  categoria_id: string;

  @IsUUID()
  @IsOptional()
  id?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  precio: number;

  @IsIn(['por_visita'])
  unidad_cobro = 'por_visita' as const;

  @IsString()
  @MaxLength(80)
  tipo_servicio: string;

  @IsBoolean()
  negociable: boolean;
}

export class ReemplazarTarifasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TarifaTecnicoDto)
  tarifas: TarifaTecnicoDto[];
}