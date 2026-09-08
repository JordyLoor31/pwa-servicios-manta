import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { api } from '../../services/api'
import type { CategoriaServicio, TarifaCategoria } from '../../types/perfil-tecnico'

export function useCategoriasTecnico() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const categorias = ref<CategoriaServicio[]>([])
  const tarifas = ref<TarifaCategoria[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const cargandoCatalogo = ref(true)
  const guardandoCategorias = ref(false)

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

  function alternarCategoria(id: string) {
    const indice = categoriasSeleccionadas.value.indexOf(id)
    if (indice >= 0) {
      categoriasSeleccionadas.value.splice(indice, 1)
    } else {
      categoriasSeleccionadas.value.push(id)
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
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Categorías y servicios actualizados.', life: 3000 })
      return true
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron guardar las categorías',
        life: 4000,
      })
      return false
    } finally {
      guardandoCategorias.value = false
    }
  }

  onMounted(async () => {
    await Promise.allSettled([cargarCatalogo(), cargarSeleccion()])
    cargandoCatalogo.value = false
  })

  return {
    categorias,
    tarifas,
    categoriasSeleccionadas,
    cargandoCatalogo,
    guardandoCategorias,
    alternarCategoria,
    guardarCategorias,
  }
}