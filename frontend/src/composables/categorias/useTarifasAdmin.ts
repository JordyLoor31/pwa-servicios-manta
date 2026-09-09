import { computed, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { api } from '../../services/api'
import type { CategoriaServicio } from '../../types/categorias'
import type { TarifaAdmin, UnidadCobro } from '../../types/tarifas'

export const OPCIONES_UNIDAD: { valor: UnidadCobro; etiqueta: string }[] = [
  { valor: 'por_hora', etiqueta: 'Por hora' },
  { valor: 'por_servicio', etiqueta: 'Por servicio' },
]

export function etiquetaUnidad(unidad: string) {
  return OPCIONES_UNIDAD.find((o) => o.valor === unidad)?.etiqueta ?? unidad
}

export function useTarifasAdmin() {
  const toast = useToast()
  const tarifas = ref<TarifaAdmin[]>([])
  const categorias = ref<CategoriaServicio[]>([])
  const cargando = ref(false)
  const guardando = ref(false)
  const eliminando = ref(false)
  const dialogoVisible = ref(false)
  const eliminarVisible = ref(false)
  const tarifaActiva = ref<TarifaAdmin | null>(null)
  const modo = ref<'crear' | 'editar'>('crear')

  const form = reactive({ categoria_id: '', precio: '', unidad: 'por_servicio' as UnidadCobro })

  const categoriasSinTarifa = computed(() => {
    const idsAsignados = new Set(tarifas.value.map((t) => t.categoria_id))
    return categorias.value.filter((c) => !idsAsignados.has(c.id))
  })

  async function cargar() {
    cargando.value = true
    try {
      const [tarifasRes, categoriasRes] = await Promise.all([
        api.get<TarifaAdmin[]>('/tarifas-categoria/admin'),
        api.get<CategoriaServicio[]>('/categorias-servicio'),
      ])
      tarifas.value = tarifasRes
      categorias.value = categoriasRes
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar las tarifas',
        life: 4000,
      })
      tarifas.value = []
      categorias.value = []
    } finally {
      cargando.value = false
    }
  }

  function resetForm() {
    form.categoria_id = ''
    form.precio = ''
    form.unidad = 'por_servicio'
  }

  function abrirCrear() {
    resetForm()
    modo.value = 'crear'
    tarifaActiva.value = null
    dialogoVisible.value = true
  }

  function abrirEditar(tarifa: TarifaAdmin) {
    form.categoria_id = tarifa.categoria_id
    form.precio = String(tarifa.precio_base)
    form.unidad = tarifa.unidad_cobro
    modo.value = 'editar'
    tarifaActiva.value = tarifa
    dialogoVisible.value = true
  }

  async function guardar() {
    const precio = Number(form.precio)
    if (modo.value === 'crear' && !form.categoria_id) {
      toast.add({ severity: 'warn', summary: 'Falta categoría', detail: 'Selecciona una categoría.', life: 3000 })
      return
    }
    if (form.precio.trim() === '' || isNaN(precio) || precio < 0) {
      toast.add({
        severity: 'warn',
        summary: 'Precio inválido',
        detail: 'El precio base debe ser un número válido.',
        life: 3000,
      })
      return
    }
    guardando.value = true
    try {
      if (tarifaActiva.value) {
        await api.put<TarifaAdmin>(`/tarifas-categoria/${tarifaActiva.value.id}`, {
          precio_base: precio,
          unidad_cobro: form.unidad,
        })
        toast.add({ severity: 'success', summary: 'Tarifa actualizada', life: 3000 })
      } else {
        await api.post<TarifaAdmin>('/tarifas-categoria', {
          categoria_id: form.categoria_id,
          precio_base: precio,
          unidad_cobro: form.unidad,
        })
        toast.add({ severity: 'success', summary: 'Tarifa creada', life: 3000 })
      }
      dialogoVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo guardar la tarifa',
        life: 4000,
      })
      await cargar()
    } finally {
      guardando.value = false
    }
  }

  function confirmarEliminar(tarifa: TarifaAdmin) {
    tarifaActiva.value = tarifa
    eliminarVisible.value = true
  }

  async function eliminar() {
    const tarifa = tarifaActiva.value
    if (!tarifa) return
    eliminando.value = true
    try {
      await api.delete<{ eliminado: boolean }>(`/tarifas-categoria/${tarifa.id}`)
      toast.add({ severity: 'success', summary: 'Tarifa eliminada', life: 3000 })
      eliminarVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo eliminar la tarifa',
        life: 4000,
      })
    } finally {
      eliminando.value = false
    }
  }

  return {
    tarifas,
    categorias,
    categoriasSinTarifa,
    cargando,
    guardando,
    eliminando,
    dialogoVisible,
    eliminarVisible,
    tarifaActiva,
    modo,
    form,
    cargar,
    abrirCrear,
    abrirEditar,
    guardar,
    confirmarEliminar,
    eliminar,
  }
}