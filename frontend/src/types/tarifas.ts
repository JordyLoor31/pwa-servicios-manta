import type { CategoriaServicio } from './categorias'

export type UnidadCobro = 'por_hora' | 'por_servicio'

export interface TarifaAdmin {
  id: string
  categoria_id: string
  precio_base: number
  unidad_cobro: UnidadCobro
  fecha_actualizacion: string
  categoria_nombre: string
  categoria_icono: string | null
  categoria_activa: boolean
}

export interface TarifaPayload {
  categoria_id: string
  precio_base: number
  unidad_cobro?: UnidadCobro
}

export interface TarifaUpdatePayload {
  precio_base: number
  unidad_cobro: UnidadCobro
}

export type { CategoriaServicio }