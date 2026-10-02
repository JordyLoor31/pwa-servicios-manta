import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CrearSolicitudDto {
  @IsUUID()
  @IsNotEmpty()
  tecnico_id: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descripcion: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;
}