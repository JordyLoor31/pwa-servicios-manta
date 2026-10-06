import { api } from './api'
import type { Direccion, DireccionPayload } from '../types/direcciones'

export const direccionesApi = {
  listar() {
    return api.get<Direccion[]>('/direcciones')
  },
  crear(payload: DireccionPayload) {
    return api.post<Direccion>('/direcciones', payload)
  },
  actualizar(id: string, payload: DireccionPayload) {
    return api.put<Direccion>(`/direcciones/${id}`, payload)
  },
  establecerPrincipal(id: string) {
    return api.put<Direccion>(`/direcciones/${id}/principal`, {})
  },
  eliminar(id: string) {
    return api.delete<{ eliminada: boolean }>(`/direcciones/${id}`)
  },
}
