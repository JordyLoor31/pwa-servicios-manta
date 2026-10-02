import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RechazarSolicitudDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @IsNotEmpty()
  motivo_rechazo: string;
}