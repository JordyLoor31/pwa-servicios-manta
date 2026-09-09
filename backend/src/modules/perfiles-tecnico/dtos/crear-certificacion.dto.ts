import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CrearCertificacionDto {
  @IsString()
  @IsNotEmpty({ message: 'tipo_documento es requerido' })
  @MaxLength(100, { message: 'tipo_documento no puede superar 100 caracteres' })
  tipo_documento: string;

  @IsString()
  @IsNotEmpty({ message: 'url_documento es requerido' })
  @Matches(/^(https?:\/\/|\/)\S+$/i, {
    message: 'url_documento debe ser una URL válida (http(s):// o ruta /)',
  })
  @MaxLength(255, { message: 'url_documento no puede superar 255 caracteres' })
  url_documento: string;
}