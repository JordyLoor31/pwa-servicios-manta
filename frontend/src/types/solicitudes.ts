export type EstadoSolicitud =
  | 'pendiente'
  | 'expirada'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'completada'

export interface UsuarioResumen {
  id: string
  nombres: string
  apellidos: string
}

export interface CalificacionSolicitud {
  id: string
  solicitud_id: string
  cliente_id: string
  tecnico_id: string
  calificacion: number
  comentario: string | null
  categoria_id?: string | null
  tipo_servicio?: string | null
  fecha_creacion: string
}

export interface Solicitud {
  id: string
  estado: EstadoSolicitud
  descripcion: string
  direccion: string | null
  direccion_latitud?: number | null
  direccion_longitud?: number | null
  motivo_rechazo: string | null
  fecha_propuesta: string | null
  hora_propuesta: string | null
  hora_fin_estimada?: string | null
  fecha_solicitud: string
  fecha_aceptacion: string | null
  fecha_completada: string | null
  cliente: UsuarioResumen
  tecnico: UsuarioResumen | null
  unidad_cobro?: 'por_hora' | 'por_servicio' | 'por_visita' | null
  duracion_oferta_minutos?: 30 | 180 | 360 | 540 | null
  oferta_hasta_fin_dia?: boolean
  tipos_servicio?: string[]
  tipos_servicio_por_categoria?: Record<string, string[]>
  fecha_expiracion_oferta?: string | null
  postulado_por_mi?: boolean
  estado_mi_postulacion?: EstadoPostulacion | null
  tecnico_radio_cobertura_km?: number | null
  tecnico_distancia_km?: number | null
  tecnico_cubre_zona?: boolean | null
  calificacion?: CalificacionSolicitud | null
  categorias?: Array<{ id: string; nombre: string; icono: string | null }>
}

export type EstadoPostulacion = 'pendiente' | 'rechazada' | 'aceptada' | 'cancelada'

export interface PostulacionSolicitud {
  id: string
  solicitud_id: string
  tecnico_id: string
  unidad_cobro: 'por_hora' | 'por_servicio' | 'por_visita'
  precio: number
  tipo_servicio: string
  categoria_id?: string | null
  negociable: boolean
  mensaje: string | null
  estado: EstadoPostulacion
  fecha_postulacion: string
  tecnico_nombres: string
  tecnico_apellidos: string
  tecnico_avatar_url?: string | null
  tecnico_verificado: boolean
  tecnico_calificacion: number
  tecnico_servicios_completados: number
  tecnico_biografia?: string | null
  tecnico_anios_experiencia?: number | null
  tecnico_radio_cobertura_km?: number | null
  tecnico_distancia_km?: number | null
  tecnico_cubre_zona?: boolean | null
}

export interface SolicitudesPaginadas {
  data: Solicitud[]
  total: number
  page: number
  limit: number
}

export interface CrearSolicitudPayload {
  tecnico_id?: string
  descripcion: string
  direccion?: string
  direccion_latitud?: number
  direccion_longitud?: number
  fecha_propuesta?: string
  hora_propuesta?: string
  duracion_oferta_minutos?: 30 | 180 | 360 | 540
  oferta_hasta_fin_dia?: boolean
  tipos_servicio: string[]
  categoria_ids: string[]
  categorias_personalizadas?: string[]
  tipos_servicio_por_categoria?: Record<string, string[]>
}

export interface TecnicoDirectorio {
  id: string
  nombres: string
  apellidos: string
  email: string
  verificado: boolean
  calificacion_promedio: number
  total_servicios_completados: number
}