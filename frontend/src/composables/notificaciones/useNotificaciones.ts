import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? window.location.origin
) as string

const conectado = ref(false)
const solicitudesNuevas = ref(0)
let socket: Socket | null = null

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
  socket.on('solicitud.nueva', (payload: unknown) => {
    solicitudesNuevas.value += 1
    window.dispatchEvent(new CustomEvent('camello:solicitud-nueva', { detail: payload }))
  })
  socket.on('solicitud.actualizada', (payload: unknown) => {
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