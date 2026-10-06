import { api } from './api'
import type {
  DisponibilidadSlot,
  ReemplazarDisponibilidadPayload,
} from '../types/disponibilidad'

export const disponibilidadApi = {
  listar(tecnicoId: string) {
    return api.get<DisponibilidadSlot[]>(`/perfiles-tecnico/${tecnicoId}/disponibilidad`)
  },
  reemplazar(tecnicoId: string, payload: ReemplazarDisponibilidadPayload) {
    return api.put<DisponibilidadSlot[]>(
      `/perfiles-tecnico/${tecnicoId}/disponibilidad`,
      payload,
    )
  },
}
