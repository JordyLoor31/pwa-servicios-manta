import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { Solicitud } from '../../types/solicitudes'

type AccionSolicitud = 'aceptar' | 'rechazar' | 'cancelar'

export function useSolicitudAcciones(
  solicitudActiva: Ref<Solicitud | null>,
  cerrarDetalle: () => void,
  cargar: () => Promise<void>,
) {
  const toast = useToast()
  const confirmarAccionVisible = ref(false)
  const accionPendiente = ref<AccionSolicitud | null>(null)
  const motivoRechazo = ref('')
  const fechaAceptacion = ref('')
  const horaAceptacion = ref('08:00')
  const duracionHorasAceptacion = ref(1)

  function preparar(solicitud: Solicitud, accion: AccionSolicitud) {
    solicitudActiva.value = solicitud
    accionPendiente.value = accion
    if (accion === 'aceptar') {
      fechaAceptacion.value = solicitud.fecha_propuesta ?? new Date().toISOString().slice(0, 10)
      horaAceptacion.value = solicitud.hora_propuesta?.slice(0, 5) ?? '08:00'
      duracionHorasAceptacion.value = 1
    }
    if (accion === 'rechazar') motivoRechazo.value = ''
    confirmarAccionVisible.value = true
  }

  async function ejecutarAccion() {
    const solicitud = solicitudActiva.value
    const accion = accionPendiente.value
    if (!solicitud || !accion) return
    try {
      if (accion === 'aceptar') {
        if (!fechaAceptacion.value || !/^\d{2}:\d{2}$/.test(horaAceptacion.value) || duracionHorasAceptacion.value < 1 || duracionHorasAceptacion.value > 12) {
          toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Indica fecha, hora de inicio y duración entre 1 y 12 horas.', life: 3000 })
          return
        }
        await solicitudesApi.aceptar(solicitud.id, {
          fecha_servicio: fechaAceptacion.value,
          hora_inicio: horaAceptacion.value,
          duracion_horas: duracionHorasAceptacion.value,
        })
        toast.add({ severity: 'success', summary: 'Solicitud aceptada', life: 3000 })
      } else if (accion === 'cancelar') {
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
    fechaAceptacion,
    horaAceptacion,
    duracionHorasAceptacion,
    confirmarAceptar: (solicitud: Solicitud) => preparar(solicitud, 'aceptar'),
    confirmarCancelar: (solicitud: Solicitud) => preparar(solicitud, 'cancelar'),
    confirmarRechazar: (solicitud: Solicitud) => preparar(solicitud, 'rechazar'),
    ejecutarAccion,
    cerrarConfirmacion: () => {
      confirmarAccionVisible.value = false
    },
  }
}
