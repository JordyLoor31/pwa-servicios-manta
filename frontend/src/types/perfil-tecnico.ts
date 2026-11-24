export interface PerfilTecnico {
  usuario_id: string
  biografia: string | null
  anios_experiencia: number | null
  radio_cobertura_km: number | null
}

export type { CategoriaServicio } from './categorias'

export type UnidadCobro = 'por_visita'

export interface RangoPrecio {
  precio: string
  tipoServicio: string
  negociable: boolean
  unidad: UnidadCobro
}

export interface TarifaTecnico {
  tecnico_id: string
  categoria_id: string
  precio: number
  unidad_cobro: UnidadCobro
  tipo_servicio: string
  negociable: boolean
}

export interface CalificacionPublica {
  id: string
  calificacion: number
  comentario: string | null
  fecha_creacion: string
  cliente: {
    nombres: string
    apellidos: string
  }
}

export interface PerfilPublico {
  usuario: {
    id: string
    nombres: string
    apellidos: string
    avatar_url: string | null
  }
  perfil: {
    biografia: string | null
    anios_experiencia: number | null
    radio_cobertura_km: number | null
    verificado: boolean
    calificacion_promedio: number
    total_servicios_completados: number
  }
  categorias: Array<{ id: string; nombre: string; icono: string | null }>
  tarifas: Array<{
    categoria_id: string
    categoria_nombre: string | null
    precio: number
    unidad_cobro: UnidadCobro
    tipo_servicio: string
    negociable: boolean
  }>
  certificaciones: Array<{
    tipo_documento: string
    estado: string
    fecha_revision: string | null
  }>
  calificaciones: CalificacionPublica[]
  total_calificaciones: number
}