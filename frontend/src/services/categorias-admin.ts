import { api } from './api'
import type { CategoriaForm, CategoriaServicio } from '../types/categorias'

export const categoriasAdminApi = {
  listar() {
    return api.get<CategoriaServicio[]>('/categorias-servicio')
  },
  crear(payload: CategoriaForm) {
    return api.post('/categorias-servicio', payload)
  },
  actualizar(id: string, payload: CategoriaForm) {
    return api.put(`/categorias-servicio/${id}`, payload)
  },
  eliminar(id: string) {
    return api.delete(`/categorias-servicio/${id}`)
  },
}
