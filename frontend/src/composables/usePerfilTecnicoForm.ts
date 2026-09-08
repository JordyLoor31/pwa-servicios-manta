import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from './useAuthz'
import { api } from '../services/api'
import type { CategoriaServicio, PerfilTecnico, TarifaCategoria } from '../types/perfil-tecnico'

export function usePerfilTecnicoForm() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const activeStep = ref(1)
  const cargandoDatos = ref(false)
  const cargandoCatalogo = ref(true)
  const guardandoCategorias = ref(false)

  const aniosExperiencia = ref<number | null>(null)
  const radioCobertura = ref<number | null>(null)
  const biografia = ref('')
  const perfilExistente = ref(false)

  const categorias = ref<CategoriaServicio[]>([])
  const tarifas = ref<TarifaCategoria[]>([])
  const categoriasSeleccionadas = ref<string[]>([])

  function notificarExito(detail: string) {
    toast.add({ severity: 'success', summary: 'Guardado', detail, life: 3000 })
  }

  function notificarError(error: unknown, contexto: string) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : contexto,
      life: 4000,
    })
  }

  async function cargarPerfil() {
    if (!usuarioId.value) return
    try {
      const perfil = await api.get<PerfilTecnico>(`/perfiles-tecnico/${usuarioId.value}`)
      aniosExperiencia.value = perfil.anios_experiencia
      radioCobertura.value = perfil.radio_cobertura_km
      biografia.value = perfil.biografia ?? ''
      perfilExistente.value = true
    } catch {
      perfilExistente.value = false
    }
  }

  async function cargarCatalogo() {
    try {
      const [cats, tarifasRest] = await Promise.all([
        api.get<CategoriaServicio[]>('/categorias-servicio?soloActivas=true'),
        api.get<TarifaCategoria[]>('/tarifas-categoria'),
      ])
      categorias.value = cats
      tarifas.value = tarifasRest
    } catch {
      categorias.value = []
      tarifas.value = []
    }
  }

  async function cargarSeleccion() {
    if (!usuarioId.value) return
    try {
      const seleccion = await api.get<CategoriaServicio[]>(`/perfiles-tecnico/${usuarioId.value}/categorias`)
      categoriasSeleccionadas.value = seleccion.map((categoria) => categoria.id)
    } catch {
      categoriasSeleccionadas.value = []
    }
  }

  onMounted(async () => {
    await Promise.allSettled([cargarPerfil(), cargarCatalogo(), cargarSeleccion()])
    cargandoCatalogo.value = false
  })

  function alternarCategoria(id: string) {
    const indice = categoriasSeleccionadas.value.indexOf(id)
    if (indice >= 0) {
      categoriasSeleccionadas.value.splice(indice, 1)
    } else {
      categoriasSeleccionadas.value.push(id)
    }
  }

  function irAPaso(paso: number) {
    activeStep.value = paso
  }

  async function guardarDatos(): Promise<boolean> {
    const id = usuarioId.value
    if (!id) return false
    cargandoDatos.value = true
    try {
      const datos = {
        anios_experiencia: aniosExperiencia.value ?? undefined,
        radio_cobertura_km: radioCobertura.value ?? undefined,
        biografia: biografia.value.trim() || undefined,
      }
      if (perfilExistente.value) {
        await api.put(`/perfiles-tecnico/${id}`, datos)
      } else {
        await api.post('/perfiles-tecnico', datos)
      }
      perfilExistente.value = true
      notificarExito('Datos del técnico guardados.')
      irAPaso(2)
      return true
    } catch (error) {
      notificarError(error, 'No se pudieron guardar los datos')
      return false
    } finally {
      cargandoDatos.value = false
    }
  }

  async function guardarCategorias(): Promise<boolean> {
    const id = usuarioId.value
    if (!id) return false
    guardandoCategorias.value = true
    try {
      await api.put(`/perfiles-tecnico/${id}/categorias`, {
        categoria_ids: categoriasSeleccionadas.value,
      })
      notificarExito('Categorías y servicios actualizados.')
      irAPaso(3)
      return true
    } catch (error) {
      notificarError(error, 'No se pudieron guardar las categorías')
      return false
    } finally {
      guardandoCategorias.value = false
    }
  }

  return {
    activeStep,
    cargandoDatos,
    cargandoCatalogo,
    guardandoCategorias,
    aniosExperiencia,
    radioCobertura,
    biografia,
    categorias,
    tarifas,
    categoriasSeleccionadas,
    alternarCategoria,
    irAPaso,
    guardarDatos,
    guardarCategorias,
  }
}