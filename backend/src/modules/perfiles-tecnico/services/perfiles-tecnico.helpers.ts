import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PerfilTecnico } from '../entities/perfil-tecnico.entity';

export interface FilaDirectorio {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  verificado: boolean;
  calificacion_promedio: string | number;
  total_servicios_completados: string | number;
}

export function toPublic(perfil: PerfilTecnico) {
  return {
    usuario_id: perfil.usuario_id,
    biografia: perfil.biografia,
    anios_experiencia: perfil.anios_experiencia,
    calificacion_promedio: perfil.calificacion_promedio,
    total_servicios_completados: perfil.total_servicios_completados,
    verificado: perfil.verificado,
  };
}

export function toDirectorio(filas: FilaDirectorio[]) {
  return filas.map((fila) => ({
    ...fila,
    calificacion_promedio: Number(fila.calificacion_promedio ?? 0),
    total_servicios_completados: Number(fila.total_servicios_completados ?? 0),
  }));
}

export async function asegurarPerfil(
  perfilesRepository: Repository<PerfilTecnico>,
  usuarioId: string,
) {
  const perfil = await perfilesRepository.findOneBy({ usuario_id: usuarioId });
  if (!perfil) {
    throw new NotFoundException(`Perfil técnico del usuario ${usuarioId} no encontrado`);
  }
  return perfil;
}
