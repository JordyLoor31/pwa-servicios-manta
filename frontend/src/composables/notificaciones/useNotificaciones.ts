import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? window.location.origin
) as string

const conectado = ref(false)
const solicitudesNuevas = ref(0)
const notificaciones = ref<Notificacion[]>([])
let socket: Socket | null = null

interface EventoSolicitud {
  evento?: 'solicitud.nueva' | 'solicitud.actualizada'
  solicitud?: {
    id?: string
    estado?: string
    cliente?: { nombres?: string; apellidos?: string }
    tecnico?: { nombres?: string; apellidos?: string }
  }
}

interface Notificacion {
  id: string
  tipo: 'solicitud.nueva' | 'solicitud.actualizada'
  solicitudId: string
  titulo: string
  mensaje: string
  leida: boolean
  fecha: Date
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

export async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
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
    const ev = payload as EventoSolicitud
    const solicitud = ev?.solicitud
    const cliente = `${solicitud?.cliente?.nombres ?? 'Un cliente'} ${solicitud?.cliente?.apellidos ?? ''}`.trim()
    const notif: Notificacion = {
      id: crypto.randomUUID(),
      tipo: 'solicitud.nueva',
      solicitudId: solicitud?.id ?? '',
      titulo: 'Nueva solicitud de servicio',
      mensaje: `${cliente} quiere un servicio. Ábrela para responder.`,
      leida: false,
      fecha: new Date(),
    }
    notificaciones.value.unshift(notif)
    notificarSistema('Nueva solicitud de servicio', `${cliente} quiere un servicio. Ábrela para responder.`)
    window.dispatchEvent(new CustomEvent('camello:solicitud-nueva', { detail: payload }))
  })
  socket.on('solicitud.actualizada', (payload) => {
    const ev = payload as EventoSolicitud
    const solicitud = ev?.solicitud
    const estado = ETIQUETAS_ESTADO[solicitud?.estado ?? ''] ?? 'actualizada'
    const notif: Notificacion = {
      id: crypto.randomUUID(),
      tipo: 'solicitud.actualizada',
      solicitudId: solicitud?.id ?? '',
      titulo: 'Solicitud actualizada',
      mensaje: `Tu solicitud quedó ${estado}.`,
      leida: false,
      fecha: new Date(),
    }
    notificaciones.value.unshift(notif)
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

export function marcarComoLeida(id: string) {
  const n = notificaciones.value.find((x) => x.id === id)
  if (n) n.leida = true
}

export function marcarTodasComoLeidas() {
  notificaciones.value.forEach((n) => (n.leida = true))
  solicitudesNuevas.value = 0
}

export function usarNotificaciones() {
  return { conectado, solicitudesNuevas, notificaciones, marcarComoLeida, marcarTodasComoLeidas }
}

export type { Notificacion }