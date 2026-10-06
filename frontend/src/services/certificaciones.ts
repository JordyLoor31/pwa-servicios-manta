import { api } from './api'
import type { Certificacion, CrearCertificacionPayload } from '../types/certificaciones'

export const certificacionesApi = {
  listar(tecnicoId: string) {
    return api.get<Certificacion[]>(`/perfiles-tecnico/${tecnicoId}/certificaciones`)
  },
  crear(tecnicoId: string, payload: CrearCertificacionPayload) {
    return api.post<Certificacion>(`/perfiles-tecnico/${tecnicoId}/certificaciones`, payload)
  },
  eliminar(tecnicoId: string, certificacionId: string) {
    return api.delete<{ eliminado: boolean }>(
      `/perfiles-tecnico/${tecnicoId}/certificaciones/${certificacionId}`,
    )
  },
}
