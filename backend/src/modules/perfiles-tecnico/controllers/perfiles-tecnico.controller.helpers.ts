import { BadRequestException } from '@nestjs/common';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseCategorias(categorias?: string): string[] {
  return [...new Set(
    (categorias ?? '')
      .split(',')
      .map((categoria) => categoria.trim())
      .filter(Boolean),
  )];
}

export function validarDia(dia: number): boolean {
  return dia >= 0 && dia <= 6;
}

export function validarUuidOpcional(valor: string | undefined, mensaje: string): void {
  if (valor && !UUID_REGEX.test(valor)) {
    throw new BadRequestException(mensaje);
  }
}

export function validarFecha(fecha: string | undefined): asserts fecha is string {
  if (!fecha || !FECHA_REGEX.test(fecha)) {
    throw new BadRequestException('fecha debe tener formato YYYY-MM-DD');
  }

  const fechaParseada = new Date(`${fecha}T12:00:00Z`);
  if (Number.isNaN(fechaParseada.getTime()) || fechaParseada.toISOString().slice(0, 10) !== fecha) {
    throw new BadRequestException('fecha debe ser una fecha válida');
  }
}
