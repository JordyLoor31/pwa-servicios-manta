import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum UnidadCobroPostulacion {
  POR_HORA = 'por_hora',
  POR_SERVICIO = 'por_servicio',
}

export class CrearPostulacionDto {
  @IsEnum(UnidadCobroPostulacion)
  unidad_cobro: UnidadCobroPostulacion;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999)
  precio: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensaje?: string;
}
