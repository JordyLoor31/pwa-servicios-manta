import { notificacionesApi } from '../../services/notificaciones'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalizado = `${base64.replace(/-/g, '+').replace(/_/g, '/')}${relleno}`
  const datos = atob(normalizado)
  const arreglo = new Uint8Array(new ArrayBuffer(datos.length))
  for (let i = 0; i < datos.length; i += 1) {
    arreglo[i] = datos.charCodeAt(i)
  }
  return arreglo
}

interface SuscripcionClave {
  p256dh: string
  auth: string
}

export async function registrarSuscripcionPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!publicKey) {
    return false
  }
  try {
    const registro = await navigator.serviceWorker.ready
    let suscripcion = await registro.pushManager.getSubscription()
    if (!suscripcion) {
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
    const claves = suscripcion.toJSON().keys as unknown as SuscripcionClave | undefined
    if (!claves) {
      return false
    }
    await notificacionesApi.registrarSuscripcion({
      endpoint: suscripcion.endpoint,
      p256dh: claves.p256dh,
      auth: claves.auth,
    })
    return true
  } catch {
    return false
  }
}