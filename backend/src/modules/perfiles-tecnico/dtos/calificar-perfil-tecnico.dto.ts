import { IsNumber, Max, Min } from 'class-validator';

export class CalificarPerfilTecnicoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  calificacion: number;
}