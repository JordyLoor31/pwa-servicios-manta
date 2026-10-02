import type { EstadoSolicitud } from '../types/solicitudes'

const SEVERIDADES: Record<EstadoSolicitud, 'warn' | 'info' | 'danger' | 'secondary' | 'success'> = {
  pendiente: 'warn',
  aceptada: 'info',
  rechazada: 'danger',
  cancelada: 'secondary',
  completada: 'success',
}

const LABELES: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  completada: 'Completada',
}

export function estadoSeveridad(estado: EstadoSolicitud) {
  return SEVERIDADES[estado]
}

export function estadoLabel(estado: EstadoSolicitud) {
  return LABELES[estado]
}