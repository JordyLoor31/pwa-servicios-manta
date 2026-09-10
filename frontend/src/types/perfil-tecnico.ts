export interface PerfilTecnico {
  usuario_id: string
  biografia: string | null
  anios_experiencia: number | null
  radio_cobertura_km: number | null
}

export type { CategoriaServicio } from './categorias'

export interface RangoPrecio {
  min: string
  max: string
}

export interface TarifaTecnico {
  tecnico_id: string
  categoria_id: string
  precio_min: number
  precio_max: number
}