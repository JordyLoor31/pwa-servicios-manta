import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { Solicitud } from '../../types/solicitudes'

type AccionSolicitud = 'rechazar' | 'cancelar'

export function useSolicitudAcciones(
  solicitudActiva: Ref<Solicitud | null>,
  cerrarDetalle: () => void,
  cargar: () => Promise<void>,
) {
  const toast = useToast()
  const confirmarAccionVisible = ref(false)
  const accionPendiente = ref<AccionSolicitud | null>(null)
  const motivoRechazo = ref('')
  function preparar(solicitud: Solicitud, accion: AccionSolicitud) {
    solicitudActiva.value = solicitud
    accionPendiente.value = accion
    if (accion === 'rechazar') motivoRechazo.value = ''
    confirmarAccionVisible.value = true
  }

  async function ejecutarAccion() {
    const solicitud = solicitudActiva.value
    const accion = accionPendiente.value
    if (!solicitud || !accion) return
    try {
      if (accion === 'cancelar') {
        await solicitudesApi.cancelar(solicitud.id)
        toast.add({ severity: 'success', summary: 'Solicitud cancelada', life: 3000 })
      } else {
        if (motivoRechazo.value.trim().length < 5) {
          toast.add({ severity: 'warn', summary: 'Falta el motivo', detail: 'Indica al cliente el motivo del rechazo (mínimo 5 caracteres).', life: 3000 })
          return
        }
        await solicitudesApi.rechazar(solicitud.id, motivoRechazo.value.trim())
        toast.add({ severity: 'success', summary: 'Solicitud rechazada', life: 3000 })
      }
      confirmarAccionVisible.value = false
      cerrarDetalle()
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo completar la acción',
        life: 4000,
      })
    }
  }

  return {
    confirmarAccionVisible,
    accionPendiente,
    motivoRechazo,
    confirmarCancelar: (solicitud: Solicitud) => preparar(solicitud, 'cancelar'),
    confirmarRechazar: (solicitud: Solicitud) => preparar(solicitud, 'rechazar'),
    ejecutarAccion,
    cerrarConfirmacion: () => {
      confirmarAccionVisible.value = false
    },
  }
}
