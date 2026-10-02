import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? window.location.origin
) as string

const conectado = ref(false)
const solicitudesNuevas = ref(0)
let socket: Socket | null = null

interface EventoSolicitud {
  evento?: 'solicitud.nueva' | 'solicitud.actualizada'
  solicitud?: {
    estado?: string
    cliente?: { nombres?: string; apellidos?: string }
    tecnico?: { nombres?: string; apellidos?: string }
  }
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: 'pendiente',
  aceptada: 'aceptada',
  rechazada: 'rechazada',
  cancelada: 'cancelada',
  completada: 'completada',
}

function notificarSistema(titulo: string, cuerpo: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  const opciones: NotificationOptions = {
    body: cuerpo,
    icon: '/faviconcamello.png',
    badge: '/faviconcamello.png',
    tag: 'solicitud',
  }
  try {
    const n = new Notification(titulo, opciones)
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    navigator.serviceWorker?.ready
      .then((registro) => registro.showNotification(titulo, opciones))
      .catch(() => {})
  }
}

export function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

export function conectarNotificaciones(token: string) {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  socket = io(`${API_URL}/notificaciones`, {
    auth: { token },
    transports: ['websocket'],
  })
  socket.on('connect', () => {
    conectado.value = true
  })
  socket.on('disconnect', () => {
    conectado.value = false
  })
  socket.on('solicitud.nueva', (payload) => {
    solicitudesNuevas.value += 1
    const solicitud = (payload as EventoSolicitud)?.solicitud
    const cliente = `${solicitud?.cliente?.nombres ?? 'Un cliente'} ${solicitud?.cliente?.apellidos ?? ''}`.trim()
    notificarSistema('Nueva solicitud de servicio', `${cliente} quiere un servicio. Ábrela para responder.`)
    window.dispatchEvent(new CustomEvent('camello:solicitud-nueva', { detail: payload }))
  })
  socket.on('solicitud.actualizada', (payload) => {
    const solicitud = (payload as EventoSolicitud)?.solicitud
    const estado = ETIQUETAS_ESTADO[solicitud?.estado ?? ''] ?? 'actualizada'
    notificarSistema('Solicitud actualizada', `Tu solicitud quedó ${estado}.`)
    window.dispatchEvent(new CustomEvent('camello:solicitud-actualizada', { detail: payload }))
  })
}

export function desconectarNotificaciones() {
  socket?.disconnect()
  socket = null
  conectado.value = false
}

export function limpiarNotificacionesNuevas() {
  solicitudesNuevas.value = 0
}

export function usarNotificaciones() {
  return { conectado, solicitudesNuevas }
}