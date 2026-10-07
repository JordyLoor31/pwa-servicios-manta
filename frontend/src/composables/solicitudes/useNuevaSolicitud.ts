import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { categoriasApi } from '../../services/categorias'
import { solicitudesApi } from '../../services/solicitudes'
import { useDirecciones } from '../direcciones/useDirecciones'
import type { CategoriaServicio } from '../../types/categorias'
import type { Solicitud, TecnicoDirectorio } from '../../types/solicitudes'

export function useNuevaSolicitud() {
  const toast = useToast()
  const horasBase = Array.from({ length: 48 }, (_, indice) => {
    const hora = Math.floor(indice / 2)
    return `${String(hora).padStart(2, '0')}:${indice % 2 === 0 ? '00' : '30'}`
  })

  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const fechaServicio = ref<Date>(new Date())
  const tecnicos = ref<TecnicoDirectorio[]>([])
  const cargandoTecnicos = ref(false)
  const horas = ref<string[]>([...horasBase])
  const horaBusqueda = ref(horasBase[0])
  const enviando = ref(false)
  const duracionOferta = ref<30 | 60>(30)

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
      if (form.value.tecnico_id && !tecnicos.value.some((t) => t.id === form.value.tecnico_id)) {
        form.value.tecnico_id = ''
      }
    } catch {
      tecnicos.value = []
      horaBusqueda.value = horas.value[0] ?? ''
    } finally {
      cargandoTecnicos.value = false
    }
  }

  async function cargarHoras() {
    const tecnicoId = form.value.tecnico_id
    if (!tecnicoId) {
      horaBusqueda.value = horas.value[0] ?? ''
      return
    }
    try {
      const horasDisponibles = await solicitudesApi.horariosDisponiblesParaTecnico(
        fechaServicio.value.getDay(),
        tecnicoId,
        categoriasSeleccionadas.value,
      )
      horas.value = horasDisponibles.length > 0 ? horasDisponibles : [...horasBase]
      if (!horas.value.includes(horaBusqueda.value)) {
        horaBusqueda.value = horas.value[0] ?? ''
      }
    } catch {
      horas.value = [...horasBase]
      if (!horas.value.includes(horaBusqueda.value)) {
        horaBusqueda.value = horas.value[0] ?? ''
      }
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
    horas.value = [...horasBase]
    horaBusqueda.value = horasBase[0]
    direccionSeleccionadaId.value = ''
    duracionOferta.value = 30
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
    if (descripcion.length < 10 || !horaBusqueda.value || categoriasSeleccionadas.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona al menos una categoría, una hora y describe la necesidad (mínimo 10 caracteres).',
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
        duracion_oferta_minutos: 30 | 60
        categoria_ids: string[]
      } = {
        descripcion,
        direccion: form.value.direccion.trim() || undefined,
        direccion_latitud: direccionLatitud.value,
        direccion_longitud: direccionLongitud.value,
        fecha_propuesta: aFechaISO(fechaServicio.value),
        hora_propuesta: horaBusqueda.value,
        duracion_oferta_minutos: duracionOferta.value,
        categoria_ids: categoriasSeleccionadas.value,
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
    duracionOferta,
    enviando,
    form,
    direcciones,
    direccionSeleccionadaId,

    cargarCategorias,
    iniciar,
    crear,
  }
}
