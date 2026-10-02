import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim, setCacheNameDetails } from 'workbox-core'

setCacheNameDetails({ prefix: 'camelloapp' })
cleanupOutdatedCaches()
precacheAndRoute((self as unknown as { __WB_MANIFEST: string[] }).__WB_MANIFEST)
clientsClaim()

interface EventoPush extends Event {
  data?: { json(): unknown } | null
}

interface EventoNotificacionClick extends Event {
  notification: {
    close(): void
    data?: { url?: string | null }
  }
}

interface ClienteVentana {
  url: string
  focus(): Promise<unknown>
  navigate(url: string): Promise<unknown>
}

interface ClientesGestor {
  matchAll(opciones: { type: string; includeUncontrolled: boolean }): Promise<ClienteVentana[]>
  openWindow(url: string): Promise<unknown>
}

interface Registro {
  showNotification(titulo: string, opciones: NotificationOptions): Promise<unknown>
}

function scopeDeServicio(): {
  registration: Registro
  clients: ClientesGestor
} {
  return self as unknown as { registration: Registro; clients: ClientesGestor }
}

self.addEventListener('push', (evento) => {
  const data = (evento as EventoPush).data?.json?.() as
    | { titulo?: string; cuerpo?: string; url?: string }
    | undefined
  const titulo = data?.titulo ?? 'CamelloApp'
  const opciones: NotificationOptions = {
    body: data?.cuerpo ?? '',
    icon: '/faviconcamello.png',
    badge: '/faviconcamello.png',
    data: { url: data?.url ?? null },
  }
  const peristencia = scopeDeServicio().registration.showNotification(titulo, opciones)
  if ('waitUntil' in evento) {
    ;(evento as { waitUntil(p: Promise<unknown>): void }).waitUntil(peristencia)
  }
})

self.addEventListener('notificationclick', (evento) => {
  const notificacion = (evento as EventoNotificacionClick).notification
  notificacion.close()
  const url = notificacion.data?.url ?? '/'
  const promesa = scopeDeServicio()
    .clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((listaDeClientes) => {
      const visible = listaDeClientes.find((cliente) => cliente.url.includes(url))
      if (visible) {
        return visible.focus()
      }
      if (listaDeClientes[0]) {
        return listaDeClientes[0].focus().then(() => listaDeClientes[0].navigate(url))
      }
      return scopeDeServicio().clients.openWindow(url)
    })
  if ('waitUntil' in evento) {
    ;(evento as { waitUntil(p: Promise<unknown>): void }).waitUntil(promesa)
  }
})