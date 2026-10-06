import { api } from './api'
import type { CategoriaServicio } from '../types/categorias'
import type { PerfilTecnico, TarifaTecnico } from '../types/perfil-tecnico'

export const perfilTecnicoApi = {
  obtener(id: string) {
    return api.get<PerfilTecnico>(`/perfiles-tecnico/${id}`)
  },

  obtenerCategorias(id: string) {
    return api.get<CategoriaServicio[]>(`/perfiles-tecnico/${id}/categorias`)
  },

  obtenerTarifas(id: string) {
    return api.get<TarifaTecnico[]>(`/perfiles-tecnico/${id}/tarifas`)
  },
  crear(payload: Partial<PerfilTecnico>) {
    return api.post('/perfiles-tecnico', payload)
  },
  actualizar(id: string, payload: Partial<PerfilTecnico>) {
    return api.put(`/perfiles-tecnico/${id}`, payload)
  },

  actualizarCategorias(id: string, categoriaIds: string[]) {
    return api.put(`/perfiles-tecnico/${id}/categorias`, {
      categoria_ids: categoriaIds,
    })
  },

  actualizarTarifas(id: string, tarifas: TarifaTecnico[]) {
    return api.put(`/perfiles-tecnico/${id}/tarifas`, { tarifas })
  },
}
