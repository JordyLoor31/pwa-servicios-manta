export interface PerfilTecnico {
  usuario_id: string
  biografia: string | null
  anios_experiencia: number | null
  radio_cobertura_km: number | null
}

export interface CategoriaServicio {
  id: string
  nombre: string
  descripcion: string | null
  icono: string | null
  activa: boolean
}

export interface TarifaCategoria {
  id: string
  categoria_id: string
  precio_base: number
  unidad_cobro: string
}