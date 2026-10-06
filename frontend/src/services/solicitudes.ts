import { api } from './api'
import type {
  CrearSolicitudPayload,
  Solicitud,
  SolicitudesPaginadas,
  TecnicoDirectorio,
} from '../types/solicitudes'

export const solicitudesApi = {
  listar(ruta: string, page: number, limit: number, estado?: string) {
    const parametros = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (estado) parametros.set('estado', estado)
    return api.get<SolicitudesPaginadas>(`${ruta}?${parametros.toString()}`)
  },

  obtener(id: string) {
    return api.get<Solicitud>(`/solicitudes/${id}`)
  },

  crear(payload: CrearSolicitudPayload) {
    return api.post<Solicitud>('/solicitudes', payload)
  },

  cancelar(id: string) {
    return api.patch(`/solicitudes/${id}/cancelar`, {})
  },

  aceptar(id: string, payload: { fecha_servicio: string; hora_inicio: string; duracion_horas: number }) {
    return api.patch(`/solicitudes/${id}/aceptar`, payload)
  },

  completar(id: string) {
    return api.patch(`/solicitudes/${id}/completar`, {})
  },

  rechazar(id: string, motivo_rechazo: string) {
    return api.patch(`/solicitudes/${id}/rechazar`, { motivo_rechazo })
  },

  horariosDisponibles(dia: number, categorias: string[]) {
    const parametros = new URLSearchParams({ dia: String(dia) })
    if (categorias.length > 0) parametros.set('categorias', categorias.join(','))
    return api.get<string[]>(`/perfiles-tecnico/disponibles/horas?${parametros.toString()}`)
  },

  tecnicosDisponibles(dia: number, hora: string, categorias: string[]) {
    const parametros = new URLSearchParams({ dia: String(dia), hora })
    if (categorias.length > 0) parametros.set('categorias', categorias.join(','))
    return api.get<TecnicoDirectorio[]>(`/perfiles-tecnico/disponibles?${parametros.toString()}`)
  },

  tecnicosDisponiblesPorDia(dia: number, categorias: string[]) {
    const parametros = new URLSearchParams({ dia: String(dia) })
    if (categorias.length > 0) parametros.set('categorias', categorias.join(','))
    return api.get<TecnicoDirectorio[]>(`/perfiles-tecnico/disponibles/por-dia?${parametros.toString()}`)
  },

  horariosDisponiblesParaTecnico(dia: number, tecnicoId: string, categorias: string[]) {
    const parametros = new URLSearchParams({ dia: String(dia), tecnico: tecnicoId })
    if (categorias.length > 0) parametros.set('categorias', categorias.join(','))
    return api.get<string[]>(`/perfiles-tecnico/disponibles/horas?${parametros.toString()}`)
  },
}
