import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoUsuario } from '../entities/usuario.entity';

export class UpdateEstadoUsuarioDto {
  @IsEnum(EstadoUsuario)
  @IsNotEmpty()
  estado: EstadoUsuario;
}