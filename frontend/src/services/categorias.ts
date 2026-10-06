import { api } from './api'
import type { CategoriaServicio } from '../types/categorias'

export const categoriasApi = {
  listar() {
    return api.get<CategoriaServicio[]>('/categorias-servicio')
  },

  listarActivas() {
    return api.get<CategoriaServicio[]>('/categorias-servicio?soloActivas=true')
  },
}
