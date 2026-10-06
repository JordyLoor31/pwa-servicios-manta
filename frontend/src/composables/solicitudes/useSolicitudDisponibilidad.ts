import { computed, ref, watch, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { categoriasApi } from '../../services/categorias'
import { solicitudesApi } from '../../services/solicitudes'
import type { CategoriaServicio } from '../../types/categorias'
import type { TecnicoDirectorio } from '../../types/solicitudes'

export function useSolicitudDisponibilidad(form: Ref<{ tecnico_id: string }>) {
  const toast = useToast()
  const fechaServicio = ref(new Date())
  const horaBusqueda = ref(horaActualAproximada())
  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const tecnicos = ref<TecnicoDirectorio[]>([])
  const horasDisponibles = ref<string[]>([])
  const cargandoTecnicos = ref(false)
  const diaBusqueda = computed(() => fechaServicio.value.getDay())

  async function cargarCategorias() {
    if (categorias.value.length > 0) return
    try {
      categorias.value = await categoriasApi.listarActivas()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar las categorías',
        life: 4000,
      })
      categorias.value = []
    }
  }

  async function cargarHorarios() {
    try {
      const horas = await solicitudesApi.horariosDisponibles(diaBusqueda.value, categoriasSeleccionadas.value)
      horasDisponibles.value = horas
      if (!horas.includes(horaBusqueda.value)) horaBusqueda.value = horas[0] ?? ''
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar los horarios disponibles',
        life: 4000,
      })
      horasDisponibles.value = []
    }
  }

  async function cargarTecnicos() {
    if (!horasDisponibles.value.includes(horaBusqueda.value)) {
      tecnicos.value = []
      return
    }
    cargandoTecnicos.value = true
    try {
      tecnicos.value = await solicitudesApi.tecnicosDisponibles(
        diaBusqueda.value,
        horaBusqueda.value,
        categoriasSeleccionadas.value,
      )
      if (form.value.tecnico_id && !tecnicos.value.some((tecnico) => tecnico.id === form.value.tecnico_id)) {
        form.value.tecnico_id = ''
      }
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

  let recalculando = false

  async function recalcular() {
    recalculando = true
    try {
      await cargarHorarios()
      await cargarTecnicos()
    } finally {
      recalculando = false
    }
  }

  watch([fechaServicio, categoriasSeleccionadas], () => void recalcular())
  watch(horaBusqueda, () => {
    if (!recalculando) void cargarTecnicos()
  })

  return {
    fechaServicio,
    horaBusqueda,
    diaBusqueda,
    categorias,
    categoriasSeleccionadas,
    tecnicos,
    horasDisponibles,
    cargandoTecnicos,
    cargarCategorias,
    recalcular,
  }
}

function horaActualAproximada(): string {
  const fecha = new Date()
  return `${String(fecha.getHours()).padStart(2, '0')}:${fecha.getMinutes() < 30 ? '00' : '30'}`
}
