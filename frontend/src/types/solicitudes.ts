export type EstadoSolicitud =
  | 'pendiente'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'completada'

export interface UsuarioResumen {
  id: string
  nombres: string
  apellidos: string
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
  fecha_solicitud: string
  fecha_aceptacion: string | null
  fecha_completada: string | null
  cliente: UsuarioResumen
  tecnico: UsuarioResumen | null
  unidad_cobro?: 'por_hora' | 'por_servicio' | null
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