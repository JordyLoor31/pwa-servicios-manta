import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { api } from '../../services/api'
import type {
  CrearSolicitudPayload,
  EstadoSolicitud,
  Solicitud,
  SolicitudesPaginadas,
  TecnicoDirectorio,
} from '../../types/solicitudes'
import { useAuthz } from '../auth/useAuthz'

const LIMITE = 20

export const OPCIONES_HORA: string[] = Array.from({ length: 48 }, (_, i) => {
  const horas = Math.floor(i / 2)
  const minutos = i % 2 === 0 ? '00' : '30'
  return `${String(horas).padStart(2, '0')}:${minutos}`
})

function horaActualAproximada(): string {
  const d = new Date()
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = d.getMinutes() < 30 ? '00' : '30'
  return `${horas}:${minutos}`
}

export function useSolicitudes() {
  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const { hasAnyRole } = useAuthz()

  const solicitudes = ref<Solicitud[]>([])
  const total = ref(0)
  const page = ref(1)
  const cargando = ref(false)
  const enviando = ref(false)

  const filtroEstado = ref<'todos' | EstadoSolicitud>('todos')
  const diaBusqueda = ref(new Date().getDay())
  const horaBusqueda = ref(horaActualAproximada())

  const tecnicos = ref<TecnicoDirectorio[]>([])
  const cargandoTecnicos = ref(false)
  const formAbierto = ref(false)
  const detalleVisible = ref(false)
  const solicitudActiva = ref<Solicitud | null>(null)
  const confirmarAccionVisible = ref(false)
  const accionPendiente = ref<'aceptar' | 'rechazar' | 'completar' | 'cancelar' | null>(null)
  const motivoRechazo = ref('')

  const esCliente = computed(() => hasAnyRole('cliente'))
  const esTecnico = computed(() => hasAnyRole('tecnico'))

  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))

  const baseRuta = computed(() =>
    esCliente.value ? '/solicitudes' : '/solicitudes/recibidas',
  )

  function rutaApi() {
    return esCliente.value ? '/solicitudes/mis' : '/solicitudes/recibidas'
  }

  async function cargar() {
    cargando.value = true
    try {
      const parametros = new URLSearchParams({ page: String(page.value), limit: String(LIMITE) })
      if (filtroEstado.value !== 'todos') {
        parametros.set('estado', filtroEstado.value)
      }
      const respuesta = await api.get<SolicitudesPaginadas>(`${rutaApi()}?${parametros.toString()}`)
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
      cargando.value = false
    }
  }

  function cambiarFiltroEstado(estado: 'todos' | EstadoSolicitud) {
    if (filtroEstado.value === estado) return
    filtroEstado.value = estado
    page.value = 1
    cargar()
  }

  async function cargarTecnicos() {
    cargandoTecnicos.value = true
    try {
      tecnicos.value = await api.get<TecnicoDirectorio[]>(
        `/perfiles-tecnico/disponibles?dia=${diaBusqueda.value}&hora=${horaBusqueda.value}`,
      )
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo cargar el directorio de técnicos',
        life: 4000,
      })
      tecnicos.value = []
    } finally {
      cargandoTecnicos.value = false
    }
  }

  watch([diaBusqueda, horaBusqueda], () => {
    cargarTecnicos()
  })

  const form = ref({
    tecnico_id: '',
    descripcion: '',
    direccion: '',
  })

  function abrirFormulario() {
    form.value = { tecnico_id: '', descripcion: '', direccion: '' }
    formAbierto.value = true
    cargarTecnicos()
  }

  async function crear() {
    const descripcion = form.value.descripcion.trim()
    if (!form.value.tecnico_id || descripcion.length < 10) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Elige un técnico y describe la necesidad (mínimo 10 caracteres).',
        life: 3000,
      })
      return
    }
    const payload: CrearSolicitudPayload = {
      tecnico_id: form.value.tecnico_id,
      descripcion,
      direccion: form.value.direccion.trim() || undefined,
    }
    enviando.value = true
    try {
      const creada = await api.post<Solicitud>('/solicitudes', payload)
      toast.add({ severity: 'success', summary: 'Solicitud enviada', life: 3000 })
      formAbierto.value = false
      if (page.value !== 1) {
        page.value = 1
      } else {
        await cargar()
      }
      router.replace({ query: { detalle: creada.id } })
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

  function irPagina(siguiente: number) {
    if (siguiente < 1 || siguiente > totalPaginas.value || siguiente === page.value) return
    page.value = siguiente
    cargar()
  }

  function verDetalle(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    detalleVisible.value = true
  }

  function confirmarAceptar(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    accionPendiente.value = 'aceptar'
    confirmarAccionVisible.value = true
  }

  function confirmarCompletar(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    accionPendiente.value = 'completar'
    confirmarAccionVisible.value = true
  }

  function confirmarCancelar(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    accionPendiente.value = 'cancelar'
    confirmarAccionVisible.value = true
  }

  function confirmarRechazar(solicitud: Solicitud) {
    solicitudActiva.value = solicitud
    motivoRechazo.value = ''
    accionPendiente.value = 'rechazar'
    confirmarAccionVisible.value = true
  }

  async function ejecutarAccion() {
    const solicitud = solicitudActiva.value
    const accion = accionPendiente.value
    if (!solicitud) return
    try {
      if (accion === 'aceptar') {
        await api.patch(`/solicitudes/${solicitud.id}/aceptar`, {})
        toast.add({ severity: 'success', summary: 'Solicitud aceptada', life: 3000 })
      } else if (accion === 'completar') {
        await api.patch(`/solicitudes/${solicitud.id}/completar`, {})
        toast.add({ severity: 'success', summary: 'Servicio completado', life: 3000 })
      } else if (accion === 'cancelar') {
        await api.patch(`/solicitudes/${solicitud.id}/cancelar`, {})
        toast.add({ severity: 'success', summary: 'Solicitud cancelada', life: 3000 })
      } else if (accion === 'rechazar') {
        if (motivoRechazo.value.trim().length < 5) {
          toast.add({
            severity: 'warn',
            summary: 'Falta el motivo',
            detail: 'Indica al cliente el motivo del rechazo (mínimo 5 caracteres).',
            life: 3000,
          })
          return
        }
        await api.patch(`/solicitudes/${solicitud.id}/rechazar`, {
          motivo_rechazo: motivoRechazo.value.trim(),
        })
        toast.add({ severity: 'success', summary: 'Solicitud rechazada', life: 3000 })
      }
      confirmarAccionVisible.value = false
      detalleVisible.value = false
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

  onMounted(() => {
    cargar()
    const detalleId = route.query.detalle
    if (typeof detalleId === 'string' && esTecnico.value) {
      abrirTecnicoPorId(detalleId)
    }
  })

  async function abrirTecnicoPorId(id: string) {
    const s = solicitudes.value.find((item) => item.id === id)
    if (s) {
      verDetalle(s)
      return
    }
    try {
      const solicitud = await api.get<Solicitud>(`/solicitudes/${id}`)
      verDetalle(solicitud)
    } catch {
      router.replace({ query: {} })
    }
  }

  return {
    solicitudes,
    total,
    page,
    totalPaginas,
    cargando,
    enviando,
    filtroEstado,
    diaBusqueda,
    horaBusqueda,
    tecnicos,
    cargandoTecnicos,
    formAbierto,
    detalleVisible,
    solicitudActiva,
    confirmarAccionVisible,
    accionPendiente,
    motivoRechazo,
    esCliente,
    esTecnico,
    baseRuta,
    form,
    cargar,
    cambiarFiltroEstado,
    abrirFormulario,
    crear,
    irPagina,
    verDetalle,
    cerrarDetalle: () => {
      detalleVisible.value = false
      router.replace({ query: {} })
    },
    confirmarAceptar,
    confirmarCompletar,
    confirmarCancelar,
    confirmarRechazar,
    ejecutarAccion,
    cerrarConfirmacion: () => {
      confirmarAccionVisible.value = false
    },
  }
}