import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { categoriasApi } from '../../services/categorias'
import { solicitudesApi } from '../../services/solicitudes'
import { useDirecciones } from '../direcciones/useDirecciones'
import type { CategoriaServicio } from '../../types/categorias'
import type { Solicitud, TecnicoDirectorio } from '../../types/solicitudes'

export function useNuevaSolicitud() {
  const toast = useToast()

  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const fechaServicio = ref<Date>(new Date())
  const tecnicos = ref<TecnicoDirectorio[]>([])
  const cargandoTecnicos = ref(false)
  const horas = ref<string[]>([])
  const horaBusqueda = ref('')
  const enviando = ref(false)

  const form = ref({ tecnico_id: '', descripcion: '', direccion: '' })
  const { direcciones, cargar: cargarDirecciones } = useDirecciones()
  const direccionSeleccionadaId = ref('')
  const direccionLatitud = ref<number | undefined>()
  const direccionLongitud = ref<number | undefined>()

  async function cargarCategorias() {
    if (categorias.value.length > 0) return
    try {
      categorias.value = await categoriasApi.listarActivas()
    } catch {
      categorias.value = []
    }
  }

  async function cargarTecnicos() {
    cargandoTecnicos.value = true
    try {
      tecnicos.value = await solicitudesApi.tecnicosDisponiblesPorDia(
        fechaServicio.value.getDay(),
        categoriasSeleccionadas.value,
      )
      horas.value = []
      horaBusqueda.value = ''
      if (form.value.tecnico_id && !tecnicos.value.some((t) => t.id === form.value.tecnico_id)) {
        form.value.tecnico_id = ''
      }
    } catch {
      tecnicos.value = []
      horas.value = []
      horaBusqueda.value = ''
    } finally {
      cargandoTecnicos.value = false
    }
  }

  async function cargarHoras() {
    const tecnicoId = form.value.tecnico_id
    if (!tecnicoId) {
      horas.value = []
      horaBusqueda.value = ''
      return
    }
    try {
      horas.value = await solicitudesApi.horariosDisponiblesParaTecnico(
        fechaServicio.value.getDay(),
        tecnicoId,
        categoriasSeleccionadas.value,
      )
      horaBusqueda.value = horas.value[0] ?? ''
    } catch {
      horas.value = []
      horaBusqueda.value = ''
    }
  }

  watch(fechaServicio, () => {
    void cargarTecnicos()
  })

  watch(categoriasSeleccionadas, () => {
    void cargarTecnicos()
  })

  watch(
    () => form.value.tecnico_id,
    () => {
      void cargarHoras()
    },
  )

  watch(direccionSeleccionadaId, (id) => {
    const direccion = direcciones.value.find((d) => d.id === id)
    if (direccion) {
      form.value.direccion = direccion.direccion_texto
      direccionLatitud.value = direccion.latitud
      direccionLongitud.value = direccion.longitud
    }
  })

  function iniciar() {
    form.value = { tecnico_id: '', descripcion: '', direccion: '' }
    categoriasSeleccionadas.value = []
    fechaServicio.value = new Date()
    horas.value = []
    horaBusqueda.value = ''
    direccionSeleccionadaId.value = ''
    direccionLatitud.value = undefined
    direccionLongitud.value = undefined
    void cargarCategorias()
    void cargarTecnicos()
    void cargarDirecciones()
  }

  function aFechaISO(fecha: Date) {
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  async function crear(): Promise<Solicitud | null> {
    const descripcion = form.value.descripcion.trim()
    if (!horaBusqueda.value || descripcion.length < 10) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Elige hora y describe la necesidad (mínimo 10 caracteres).',
        life: 3000,
      })
      return null
    }
    if (direcciones.value.length > 0 && !direccionSeleccionadaId.value) {
      toast.add({
        severity: 'warn',
        summary: 'Elegir dirección',
        detail: 'Selecciona una de tus direcciones para el servicio.',
        life: 3000,
      })
      return null
    }
    enviando.value = true
    try {
      const payload: {
        tecnico_id?: string
        descripcion: string
        direccion?: string
        direccion_latitud?: number
        direccion_longitud?: number
        fecha_propuesta: string
        hora_propuesta: string
      } = {
        descripcion,
        direccion: form.value.direccion.trim() || undefined,
        direccion_latitud: direccionLatitud.value,
        direccion_longitud: direccionLongitud.value,
        fecha_propuesta: aFechaISO(fechaServicio.value),
        hora_propuesta: horaBusqueda.value,
      }
      if (form.value.tecnico_id) payload.tecnico_id = form.value.tecnico_id
      const creada = await solicitudesApi.crear(payload)
      toast.add({ severity: 'success', summary: 'Solicitud enviada', life: 3000 })
      return creada
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo enviar la solicitud',
        life: 4000,
      })
      return null
    } finally {
      enviando.value = false
    }
  }

  return {
    categorias,
    categoriasSeleccionadas,
    fechaServicio,
    tecnicos,
    cargandoTecnicos,
    horas,
    horaBusqueda,
    enviando,
    form,
    direcciones,
    direccionSeleccionadaId,

    cargarCategorias,
    iniciar,
    crear,
  }
}
