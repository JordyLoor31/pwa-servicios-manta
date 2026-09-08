export interface UsuarioLista {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  rol: 'cliente' | 'tecnico' | 'admin'
  estado: 'activo' | 'inactivo' | 'suspendido'
  fecha_registro: string
}

export interface UsuariosPaginados {
  data: UsuarioLista[]
  total: number
  page: number
  limit: number
}