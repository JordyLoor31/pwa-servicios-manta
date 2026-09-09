import type { Certificacion } from './certificaciones'
import type { CategoriaServicio } from './categorias'

export interface TecnicoAdminLista {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  usuario_estado: 'activo' | 'suspendido'
  fecha_registro: string
  verificado: boolean
  fecha_verificacion: string | null
  biografia: string | null
  anios_experiencia: number | null
  radio_cobertura_km: number | null
  calificacion_promedio: number
  total_servicios_completados: number
}

export interface TecnicosPaginados {
  data: TecnicoAdminLista[]
  total: number
  page: number
  limit: number
}

export interface DetalleTecnico {
  perfil: {
    usuario_id: string
    biografia: string | null
    anios_experiencia: number | null
    radio_cobertura_km: number | null
    verificado: boolean
    fecha_verificacion: string | null
    calificacion_promedio: number
    total_servicios_completados: number
  }
  categorias: CategoriaServicio[]
  certificaciones: Certificacion[]
}