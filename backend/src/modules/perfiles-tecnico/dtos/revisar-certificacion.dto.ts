import { IsEnum } from 'class-validator';
import { EstadoCertificacion } from '../entities/certificacion-tecnico.entity';

export class RevisarCertificacionDto {
  @IsEnum(EstadoCertificacion)
  estado: EstadoCertificacion;
}