import { onMounted, onUnmounted } from 'vue'

export interface EventoSolicitud {
  evento?: 'solicitud.nueva' | 'solicitud.actualizada'
  solicitud?: {
    cliente?: { nombres?: string; apellidos?: string }
  }
}

export function useSolicitudEvents(handlers: {
  nueva?: (event: CustomEvent<EventoSolicitud>) => void
  actualizada?: () => void
}) {
  const onNueva = (event: Event) => handlers.nueva?.(event as CustomEvent<EventoSolicitud>)
  const onActualizada = () => handlers.actualizada?.()

  onMounted(() => {
    if (handlers.nueva) window.addEventListener('camello:solicitud-nueva', onNueva)
    if (handlers.actualizada) window.addEventListener('camello:solicitud-actualizada', onActualizada)
  })

  onUnmounted(() => {
    if (handlers.nueva) window.removeEventListener('camello:solicitud-nueva', onNueva)
    if (handlers.actualizada) window.removeEventListener('camello:solicitud-actualizada', onActualizada)
  })
}
