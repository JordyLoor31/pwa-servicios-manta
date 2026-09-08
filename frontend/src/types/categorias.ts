export interface CategoriaServicio {
  id: string
  nombre: string
  descripcion: string | null
  icono: string | null
  activa: boolean
}

export interface CategoriaForm {
  nombre: string
  descripcion?: string
  icono?: string
  activa: boolean
}

export type CategoriaModo = 'crear' | 'editar' | 'ver'