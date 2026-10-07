import type { EstadoSolicitud } from '../types/solicitudes'

const SEVERIDADES: Record<EstadoSolicitud, 'warn' | 'info' | 'danger' | 'secondary' | 'success'> = {
  pendiente: 'warn',
  expirada: 'secondary',
  aceptada: 'info',
  rechazada: 'danger',
  cancelada: 'secondary',
  completada: 'success',
}

const LABELES: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  expirada: 'Oferta expirada',
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

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function formatearPropuestaLlegada(
  fecha: string | null | undefined,
  hora: string | null | undefined,
) {
  if (!fecha || !hora) return null
  const fechaTexto = fecha.includes('T') ? fecha.slice(0, 10) : fecha
  const horaTexto = hora.length > 5 ? hora.slice(0, 5) : hora
  const base = new Date(`${fechaTexto}T00:00:00`)
  const dia = DIAS_SEMANA[base.getDay()]
  const fechaLocal = base.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
  return `${dia} ${fechaLocal} a las ${horaTexto}`.replace(/\s+/g, ' ')
}