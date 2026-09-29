import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  nombres?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  apellidos?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  telefono?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  avatar_url?: string;
}