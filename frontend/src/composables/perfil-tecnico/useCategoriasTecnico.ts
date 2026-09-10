import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { api } from '../../services/api'
import type { CategoriaServicio, RangoPrecio, TarifaTecnico } from '../../types/perfil-tecnico'

export function useCategoriasTecnico() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const tarifasPorCategoria = reactive<Record<string, RangoPrecio>>({})
  const cargandoCatalogo = ref(true)
  const guardandoCategorias = ref(false)

  async function cargarCatalogo() {
    try {
      const cats = await api.get<CategoriaServicio[]>('/categorias-servicio?soloActivas=true')
      categorias.value = cats
    } catch {
      categorias.value = []
    }
  }

  async function cargarTarifas() {
    const id = usuarioId.value
    if (!id) return
    try {
      const tarifas = await api.get<TarifaTecnico[]>(`/perfiles-tecnico/${id}/tarifas`)
      for (const tarifa of tarifas) {
        tarifasPorCategoria[tarifa.categoria_id] = {
          min: String(tarifa.precio_min),
          max: String(tarifa.precio_max),
        }
      }
    } catch {
      // sin tarifas aún
    }
  }

  async function cargarSeleccion() {
    if (!usuarioId.value) return
    try {
      const seleccion = await api.get<CategoriaServicio[]>(`/perfiles-tecnico/${usuarioId.value}/categorias`)
      categoriasSeleccionadas.value = seleccion.map((categoria) => categoria.id)
      for (const categoria of seleccion) {
        if (!tarifasPorCategoria[categoria.id]) {
          tarifasPorCategoria[categoria.id] = { min: '', max: '' }
        }
      }
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
      if (!tarifasPorCategoria[id]) {
        tarifasPorCategoria[id] = { min: '', max: '' }
      }
    }
  }

  function rangoValido(categoriaId: string): boolean {
    const rango = tarifasPorCategoria[categoriaId]
    if (!rango) return false
    const min = Number(rango.min)
    const max = Number(rango.max)
    if (rango.min.trim() === '' || rango.max.trim() === '') return false
    if (isNaN(min) || isNaN(max)) return false
    if (min < 0 || max < 0 || min > 999999.99 || max > 999999.99) return false
    if (max < min) return false
    return true
  }

  async function guardarCategorias(): Promise<boolean> {
    const id = usuarioId.value
    if (!id) return false

    const sinRango = categoriasSeleccionadas.value.filter((categoriaId) => !rangoValido(categoriaId))
    if (sinRango.length > 0) {
      const nombres = sinRango
        .map((categoriaId) => categorias.value.find((c) => c.id === categoriaId)?.nombre ?? 'Categoría')
        .join(', ')
      toast.add({
        severity: 'warn',
        summary: 'Faltan precios',
        detail: `Define un rango mínimo–máximo válido en: ${nombres}.`,
        life: 4000,
      })
      return false
    }

    guardandoCategorias.value = true
    try {
      await api.put(`/perfiles-tecnico/${id}/categorias`, {
        categoria_ids: categoriasSeleccionadas.value,
      })
      const tarifas = categoriasSeleccionadas.value.map((categoriaId): TarifaTecnico => {
        const rango = tarifasPorCategoria[categoriaId]
        return {
          tecnico_id: id,
          categoria_id: categoriaId,
          precio_min: Number(rango.min),
          precio_max: Number(rango.max),
        }
      })
      await api.put(`/perfiles-tecnico/${id}/tarifas`, { tarifas })
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Categorías y precios actualizados.',
        life: 3000,
      })
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
    await Promise.allSettled([cargarCatalogo(), cargarTarifas(), cargarSeleccion()])
    cargandoCatalogo.value = false
  })

  return {
    categorias,
    categoriasSeleccionadas,
    tarifasPorCategoria,
    cargandoCatalogo,
    guardandoCategorias,
    alternarCategoria,
    guardarCategorias,
  }
}