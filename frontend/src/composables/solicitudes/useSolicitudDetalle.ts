import { ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { Solicitud } from '../../types/solicitudes'

export function useSolicitudDetalle(
  solicitudes: Ref<Solicitud[]>,
  esTecnico: Ref<boolean>,
) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const detalleVisible = ref(false)
  const solicitudActiva = ref<Solicitud | null>(null)

  function verDetalle(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    detalleVisible.value = true
  }

  function cerrarDetalle() {
    detalleVisible.value = false
    void router.replace({ query: {} })
  }

  async function abrirPorId(id: string) {
    const solicitud = solicitudes.value.find((item) => item.id === id)
    if (solicitud) {
      verDetalle(solicitud)
      return
    }
    try {
      verDetalle(await solicitudesApi.obtener(id))
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo abrir la solicitud',
        life: 4000,
      })
      await router.replace({ query: {} })
    }
  }

  function abrirDetalleInicial() {
    const detalleId = route.query.detalle
    if (typeof detalleId === 'string' && esTecnico.value) void abrirPorId(detalleId)
  }

  return { detalleVisible, solicitudActiva, verDetalle, cerrarDetalle, abrirDetalleInicial }
}
