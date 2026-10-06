import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { EstadoSolicitud, Solicitud } from '../../types/solicitudes'

const LIMITE = 20

export function useSolicitudListado(esCliente: { value: boolean }) {
  const toast = useToast()
  const solicitudes = ref<Solicitud[]>([])
  const total = ref(0)
  const page = ref(1)
  const cargando = ref(false)
  const filtroEstado = ref<'todos' | EstadoSolicitud>('todos')
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))
  const rutaApi = () => (esCliente.value ? '/solicitudes/mis' : '/solicitudes/recibidas')

  async function cargar() {
    cargando.value = true
    try {
      const respuesta = await solicitudesApi.listar(
        rutaApi(),
        page.value,
        LIMITE,
        filtroEstado.value === 'todos' ? undefined : filtroEstado.value,
      )
      solicitudes.value = respuesta.data
      total.value = respuesta.total
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes',
        life: 4000,
      })
      solicitudes.value = []
      total.value = 0
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 800))
      cargando.value = false
    }
  }

  function cambiarFiltroEstado(estado: 'todos' | EstadoSolicitud) {
    if (filtroEstado.value === estado) return
    filtroEstado.value = estado
    page.value = 1
    void cargar()
  }

  function irPagina(siguiente: number) {
    if (siguiente < 1 || siguiente > totalPaginas.value || siguiente === page.value) return
    page.value = siguiente
    void cargar()
  }

  return {
    solicitudes,
    total,
    page,
    cargando,
    filtroEstado,
    totalPaginas,
    cargar,
    cambiarFiltroEstado,
    irPagina,
  }
}

