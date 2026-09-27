import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  id_token: string;

  @IsOptional()
  @IsIn([RolUsuario.CLIENTE, RolUsuario.TECNICO])
  rol?: RolUsuario;
}