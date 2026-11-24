import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { ApiError } from '../../services/api'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import { useCategoriasTecnico } from './useCategoriasTecnico'

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
  const cargandoPerfil = ref(true)
  const errorCargandoPerfil = ref(false)

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
    const id = usuarioId.value
    if (!id) {
      cargandoPerfil.value = false
      return
    }
    try {
      const perfil = await perfilTecnicoApi.obtener(id)
      aniosExperiencia.value = perfil.anios_experiencia
      radioCobertura.value = perfil.radio_cobertura_km
      biografia.value = perfil.biografia ?? ''
      perfilExistente.value = true
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        perfilExistente.value = false
        return
      }
      errorCargandoPerfil.value = true
      notificarError(error, 'No se pudo verificar tu perfil técnico')
    } finally {
      cargandoPerfil.value = false
    }
  }

  onMounted(() => {
    void cargarPerfil()
  })

  function irAPaso(paso: number) {
    activeStep.value = paso
  }

  async function guardarDatos(): Promise<boolean> {
    const id = usuarioId.value
    if (!id || cargandoPerfil.value || errorCargandoPerfil.value) return false
    cargandoDatos.value = true
    try {
      const datos = {
        anios_experiencia: aniosExperiencia.value ?? undefined,
        radio_cobertura_km: radioCobertura.value ?? undefined,
        biografia: biografia.value.trim() || undefined,
      }
      if (perfilExistente.value) {
        await perfilTecnicoApi.actualizar(id, datos)
      } else {
        await perfilTecnicoApi.crear(datos)
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
    cargandoPerfil,
    errorCargandoPerfil,
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