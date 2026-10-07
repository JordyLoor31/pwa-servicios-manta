import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { CrearSolicitudPayload } from '../../types/solicitudes'
import { useAuthz } from '../auth/useAuthz'
import { useSolicitudAcciones } from './useSolicitudAcciones'
import { useSolicitudDetalle } from './useSolicitudDetalle'
import { useSolicitudDisponibilidad } from './useSolicitudDisponibilidad'
import { useSolicitudListado } from './useSolicitudListado'

export const OPCIONES_HORA: string[] = Array.from({ length: 48 }, (_, indice) => {
  const horas = Math.floor(indice / 2)
  const minutos = indice % 2 === 0 ? '00' : '30'
  return `${String(horas).padStart(2, '0')}:${minutos}`
})

export function useSolicitudes() {
  const toast = useToast()
  const router = useRouter()
  const { hasAnyRole } = useAuthz()
  const esCliente = computed(() => hasAnyRole('cliente'))
  const esTecnico = computed(() => hasAnyRole('tecnico'))

  const listado = useSolicitudListado(esCliente)
  const form = ref({ tecnico_id: '', descripcion: '', direccion: '' })
  const disponibilidad = useSolicitudDisponibilidad(form)
  const formAbierto = ref(false)
  const enviando = ref(false)
  const detalle = useSolicitudDetalle(listado.solicitudes, esTecnico)
  const acciones = useSolicitudAcciones(
    detalle.solicitudActiva,
    detalle.cerrarDetalle,
    listado.cargar,
  )

  const baseRuta = computed(() => (esCliente.value ? '/solicitudes' : '/solicitudes/recibidas'))

  function abrirFormulario() {
    form.value = { tecnico_id: '', descripcion: '', direccion: '' }
    disponibilidad.categoriasSeleccionadas.value = []
    disponibilidad.fechaServicio.value = new Date()
    disponibilidad.horaBusqueda.value = horaActualAproximada()
    formAbierto.value = true
    void disponibilidad.cargarCategorias()
    void disponibilidad.recalcular()
  }

  async function crear() {
    const descripcion = form.value.descripcion.trim()
    if (descripcion.length < 10) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Describe la necesidad (mínimo 10 caracteres).',
        life: 3000,
      })
      return
    }

    const payload: CrearSolicitudPayload = {
      descripcion,
      direccion: form.value.direccion.trim() || undefined,
      categoria_ids: [],
      fecha_propuesta: new Date().toISOString().slice(0, 10),
      hora_propuesta: horaActualAproximada(),
    }
    if (form.value.tecnico_id) payload.tecnico_id = form.value.tecnico_id
    enviando.value = true
    try {
      const creada = await solicitudesApi.crear(payload)
      toast.add({ severity: 'success', summary: 'Solicitud enviada', life: 3000 })
      formAbierto.value = false
      if (listado.page.value !== 1) {
        listado.page.value = 1
      } else {
        await listado.cargar()
      }
      await router.replace({ query: { detalle: creada.id } })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo enviar la solicitud',
        life: 4000,
      })
    } finally {
      enviando.value = false
    }
  }

  onMounted(() => {
    void listado.cargar()
    detalle.abrirDetalleInicial()
  })

  return {
    ...listado,
    ...disponibilidad,
    ...detalle,
    ...acciones,
    formAbierto,
    enviando,
    esCliente,
    esTecnico,
    baseRuta,
    form,
    abrirFormulario,
    crear,
    iniciarCompletacion: solicitudesApi.iniciarCompletacion,
    confirmarCompletacion: solicitudesApi.confirmarCompletacion,
  }
}

function horaActualAproximada(): string {
  const fecha = new Date()
  return `${String(fecha.getHours()).padStart(2, '0')}:${fecha.getMinutes() < 30 ? '00' : '30'}`
}
