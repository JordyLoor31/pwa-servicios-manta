import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { api } from '../../services/api'
import { useCategoriasTecnico } from './useCategoriasTecnico'
import type { PerfilTecnico } from '../../types/perfil-tecnico'

export function usePerfilTecnicoForm() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const {
    categorias,
    tarifasPorCategoria,
    categoriasSeleccionadas,
    cargandoCatalogo,
    guardandoCategorias,
    guardarCategorias: guardarCategoriasTecnico,
  } = useCategoriasTecnico()

  const activeStep = ref(1)
  const cargandoDatos = ref(false)

  const aniosExperiencia = ref<number | null>(null)
  const radioCobertura = ref<number | null>(null)
  const biografia = ref('')
  const perfilExistente = ref(false)

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

  onMounted(async () => {
    await Promise.allSettled([cargarPerfil()])
  })

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
    if (!(await guardarCategoriasTecnico())) return false
    irAPaso(3)
    return true
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
    tarifasPorCategoria,
    categoriasSeleccionadas,
    irAPaso,
    guardarDatos,
    guardarCategorias,
  }
}