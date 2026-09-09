export interface Direccion {
  id: string
  etiqueta: string | null
  direccion_texto: string
  referencia: string | null
  latitud: number
  longitud: number
  ciudad: string
  es_principal: boolean
}

export interface DireccionPayload {
  etiqueta?: string
  direccion_texto: string
  referencia?: string
  latitud: number
  longitud: number
  ciudad?: string
  es_principal?: boolean
}