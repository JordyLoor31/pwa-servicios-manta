import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

export class SlotDisponibilidadDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dia_semana: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'hora_inicio debe tener el formato HH:MM o HH:MM:SS',
  })
  hora_inicio: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'hora_fin debe tener el formato HH:MM o HH:MM:SS',
  })
  hora_fin: string;
}

export class ReemplazarDisponibilidadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotDisponibilidadDto)
  disponibilidad: SlotDisponibilidadDto[];
}