import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { api } from '../../services/api'
import {
  actualizarSesionUsuario,
  iniciarSesion,
  type RolUsuario,
  type UsuarioSesion,
} from './useAuthz'

interface LoginResponse {
  access_token: string
  user: UsuarioSesion
}

export interface DatosRegistro {
  nombres: string
  apellidos: string
  email: string
  password: string
  telefono?: string
  rol: RolUsuario
}

export function useAuth() {
  const router = useRouter()
  const toast = useToast()
  const cargando = ref(false)

  function notificarError(error: unknown, contexto: string) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : contexto,
      life: 4000,
    })
  }

  async function login(email: string, password: string): Promise<boolean> {
    cargando.value = true
    try {
      const data = await api.post<LoginResponse>('/auth/login', { email, password })
      iniciarSesion(data.access_token, data.user)
      router.push('/')
      return true
    } catch (error) {
      notificarError(error, 'No se pudo iniciar sesión')
      return false
    } finally {
      cargando.value = false
    }
  }

  async function registro(datos: DatosRegistro): Promise<boolean> {
    cargando.value = true
    try {
      await api.post('/usuarios', datos)
      toast.add({
        severity: 'success',
        summary: 'Cuenta creada',
        detail: 'Ya puedes iniciar sesión.',
        life: 3000,
      })
      router.push('/login')
      return true
    } catch (error) {
      notificarError(error, 'No se pudo crear la cuenta')
      return false
    } finally {
      cargando.value = false
    }
  }

  async function solicitarRecuperacion(email: string): Promise<{ ok: boolean; mensaje: string }> {
    cargando.value = true
    try {
      const data = await api.post<{ mensaje: string }>('/auth/recuperar', { email })
      toast.add({
        severity: 'success',
        summary: 'Solicitud enviada',
        detail: 'Revisa tu correo para continuar.',
        life: 4000,
      })
      return { ok: true, mensaje: data.mensaje }
    } catch (error) {
      notificarError(error, 'No se pudo enviar el enlace')
      return { ok: false, mensaje: error instanceof Error ? error.message : 'Error' }
    } finally {
      cargando.value = false
    }
  }

  async function restablecerContrasena(token: string, nuevaPassword: string): Promise<boolean> {
    cargando.value = true
    try {
      const data = await api.post<{ mensaje: string }>('/auth/restablecer', {
        token,
        nueva_password: nuevaPassword,
      })
      toast.add({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: data.mensaje,
        life: 4000,
      })
      router.push('/login')
      return true
    } catch (error) {
      notificarError(error, 'No se pudo restablecer la contraseña')
      return false
    } finally {
      cargando.value = false
    }
  }

  async function actualizarMisDatos(datos: {
    nombres?: string
    apellidos?: string
    telefono?: string
  }): Promise<boolean> {
    cargando.value = true
    try {
      const usuario = await api.patch<UsuarioSesion>('/usuarios/me', datos)
      actualizarSesionUsuario(usuario)
      toast.add({
        severity: 'success',
        summary: 'Perfil actualizado',
        detail: 'Tus datos se guardaron correctamente.',
        life: 3000,
      })
      return true
    } catch (error) {
      notificarError(error, 'No se pudieron guardar los datos')
      return false
    } finally {
      cargando.value = false
    }
  }

  return { cargando, login, registro, solicitarRecuperacion, restablecerContrasena, actualizarMisDatos }
}