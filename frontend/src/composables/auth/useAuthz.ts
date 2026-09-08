import { computed } from 'vue'

export type RolUsuario = 'cliente' | 'tecnico' | 'admin'

export const ROLES: Record<'CLIENTE' | 'TECNICO' | 'ADMIN', RolUsuario> = {
  CLIENTE: 'cliente',
  TECNICO: 'tecnico',
  ADMIN: 'admin',
}

export interface UsuarioSesion {
  id: string
  nombres: string
  apellidos: string
  email: string
  rol: RolUsuario
  [key: string]: unknown
}

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'

export function leerUsuario(): UsuarioSesion | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UsuarioSesion
  } catch {
    return null
  }
}

export function tieneToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export function iniciarSesion(token: string, usuario: UsuarioSesion) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function useAuthz() {
  const usuario = computed(() => leerUsuario())
  const estaAutenticado = computed(() => Boolean(tieneToken() && usuario.value))
  const esAdmin = computed(() => usuario.value?.rol === ROLES.ADMIN)

  function hasRole(rol: RolUsuario): boolean {
    return usuario.value?.rol === rol
  }

  function hasAnyRole(...roles: RolUsuario[]): boolean {
    const rol = usuario.value?.rol
    return Boolean(rol && roles.includes(rol))
  }

  return {
    usuario,
    estaAutenticado,
    esAdmin,
    hasRole,
    hasAnyRole,
  }
}