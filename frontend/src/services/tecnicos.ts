import { api } from './api'
import type { EstadoCertificacion } from '../types/certificaciones'
import type { DetalleTecnico, TecnicosPaginados } from '../types/tecnicos'

export const tecnicosApi = {
  listar(page: number, limit: number, busqueda: string) {
    const parametros = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (busqueda) parametros.set('q', busqueda)
    return api.get<TecnicosPaginados>(`/perfiles-tecnico/admin?${parametros.toString()}`)
  },
  obtenerDetalle(id: string) {
    return api.get<DetalleTecnico>(`/perfiles-tecnico/admin/${id}`)
  },
  verificar(id: string, verificado: boolean) {
    return verificado
      ? api.post(`/perfiles-tecnico/${id}/verificar`, {})
      : api.delete(`/perfiles-tecnico/${id}/verificar`)
  },
  revisarCertificacion(id: string, certificacionId: string, estado: EstadoCertificacion) {
    return api.put(`/perfiles-tecnico/${id}/certificaciones/${certificacionId}/revisar`, { estado })
  },
  cambiarEstado(id: string, estado: 'activo' | 'suspendido') {
    return api.patch<{ id: string; estado: string }>(`/usuarios/${id}/estado`, { estado })
  },
}
