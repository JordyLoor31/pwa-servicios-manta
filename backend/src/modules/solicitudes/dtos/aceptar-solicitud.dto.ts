import { IsDateString, IsInt, IsNotEmpty, Matches, Max, Min } from 'class-validator';

export class AceptarSolicitudDto {
  @IsDateString()
  @IsNotEmpty()
  fecha_servicio: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsNotEmpty()
  hora_inicio: string;

  @IsInt()
  @Min(1)
  @Max(12)
  duracion_horas: number;
}