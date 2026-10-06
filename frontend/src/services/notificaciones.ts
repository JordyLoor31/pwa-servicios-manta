import { api } from './api'

export interface SuscripcionPushPayload {
  endpoint: string
  p256dh: string
  auth: string
}

export const notificacionesApi = {
  registrarSuscripcion(payload: SuscripcionPushPayload) {
    return api.post('/notificaciones-push/suscripcion', payload)
  },
}
