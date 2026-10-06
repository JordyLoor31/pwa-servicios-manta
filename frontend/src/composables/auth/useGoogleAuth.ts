import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { authApi } from '../../services/auth'
import { iniciarSesion, type RolUsuario } from './useAuthz'
import { useTheme } from '../useTheme'

interface CredencialGoogle {
  credential?: string
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id?: string
            auto_select?: boolean
            callback?: (respuesta: CredencialGoogle) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let cargaScript: Promise<void> | null = null

function cargarScript(): Promise<void> {
  if (!cargaScript) {
    cargaScript = new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        cargaScript = null
        reject(new Error('No se pudo cargar Google Sign-In'))
      }
      document.head.appendChild(script)
    })
  }
  return cargaScript
}

export function useGoogleAuth() {
  const router = useRouter()
  const toast = useToast()
  const { isDark } = useTheme()
  const cargando = ref(false)
  let contenedor: HTMLElement | null = null

  async function procesarCredencial(credencial?: string, rol?: RolUsuario) {
    if (!credencial) return
    cargando.value = true
    try {
      const data = await authApi.loginGoogle(credencial, rol)
      iniciarSesion(data.access_token, data.user)
      router.push('/')
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google',
        life: 4000,
      })
    } finally {
      cargando.value = false
    }
  }

  async function renderizar(el: HTMLElement, rol?: RolUsuario) {
    contenedor = el
    if (!CLIENT_ID) return
    try {
      await cargarScript()
      const googleId = window.google?.accounts?.id
      if (!googleId || !contenedor) return
      contenedor.innerHTML = ''
      googleId.initialize({
        client_id: CLIENT_ID,
        auto_select: false,
        callback: (respuesta) => {
          void procesarCredencial(respuesta.credential, rol)
        },
      })
      googleId.renderButton(contenedor, {
        type: 'standard',
        theme: isDark.value ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: contenedor.clientWidth || 336,
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Google',
        detail: error instanceof Error ? error.message : 'No se pudo cargar el botón de Google',
        life: 4000,
      })
    }
  }

  const detenerTema = watch(isDark, () => {
    if (contenedor) void renderizar(contenedor)
  })

  onBeforeUnmount(detenerTema)

  return { cargando, renderizar }
}