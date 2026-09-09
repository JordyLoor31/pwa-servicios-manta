export type EstadoCertificacion = 'pendiente' | 'aprobada' | 'rechazada'

export interface Certificacion {
  id: string
  tecnico_id: string
  tipo_documento: string
  url_documento: string
  estado: EstadoCertificacion
  fecha_revision: string | null
  fecha_creacion: string
}

export interface CrearCertificacionPayload {
  tipo_documento: string
  url_documento: string
}