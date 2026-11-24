import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { categoriasApi } from '../../services/categorias'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import type { CategoriaServicio, RangoPrecio, TarifaTecnico, UnidadCobro } from '../../types/perfil-tecnico'
import { tiposServicioParaCategoria } from '../../utils/tiposServicio'

export function useCategoriasTecnico() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const tarifasPorCategoria = reactive<Record<string, RangoPrecio[]>>({})
  const cargandoCatalogo = ref(true)
  const guardandoCategorias = ref(false)

  async function cargarCatalogo() {
    try {
      const cats = await categoriasApi.listarActivas()
      categorias.value = cats
    } catch {
      categorias.value = []
    }
  }

  async function cargarTarifas() {
    const id = usuarioId.value
    if (!id) return
    try {
      const tarifas = await perfilTecnicoApi.obtenerTarifas(id)
      const agrupadas = new Map<string, RangoPrecio[]>()
      for (const tarifa of tarifas) {
        const lista = agrupadas.get(tarifa.categoria_id) ?? []
        lista.push({
          id: tarifa.id,
          precio: String(tarifa.precio),
          tipoServicio: tarifa.tipo_servicio,
          negociable: tarifa.negociable,
          unidad: tarifa.unidad_cobro ?? 'por_visita',
        })
        agrupadas.set(tarifa.categoria_id, lista)
      }
      for (const [categoriaId, lista] of agrupadas) {
        tarifasPorCategoria[categoriaId] = lista
      }
    } catch {
      // sin tarifas aún
    }
  }

  async function cargarSeleccion() {
    if (!usuarioId.value) return
    try {
      const seleccion = await perfilTecnicoApi.obtenerCategorias(usuarioId.value)
      categoriasSeleccionadas.value = seleccion.map((categoria) => categoria.id)
      for (const categoria of seleccion) {
        asegurarEntrada(categoria.id)
      }
    } catch {
      categoriasSeleccionadas.value = []
    }
  }

  function asegurarEntrada(id: string) {
    if (!tarifasPorCategoria[id] || tarifasPorCategoria[id].length === 0) {
      tarifasPorCategoria[id] = [crearTarifaInicial(id)]
    }
  }

  function crearTarifaInicial(id: string): RangoPrecio {
    const categoria = categorias.value.find((actual) => actual.id === id)
    return {
      precio: '',
      tipoServicio: categoria ? tiposServicioParaCategoria(categoria.nombre)[0] : 'Servicio general',
      negociable: true,
      unidad: 'por_visita',
    }
  }

  function agregarTarifa(categoriaId: string) {
    const lista = tarifasPorCategoria[categoriaId] ?? []
    lista.push(crearTarifaInicial(categoriaId))
    tarifasPorCategoria[categoriaId] = lista
  }

  function eliminarTarifa(categoriaId: string, indice: number) {
    const lista = tarifasPorCategoria[categoriaId]
    if (!lista || lista.length <= 1) return
    lista.splice(indice, 1)
  }

  function rangoValido(categoriaId: string): boolean {
    const rangos = tarifasPorCategoria[categoriaId]
    if (!rangos || rangos.length === 0) return false
    return rangos.every((rango) => {
      const precio = Number(rango.precio)
      return rango.precio.trim() !== '' && rango.tipoServicio.trim() !== '' &&
        !isNaN(precio) && precio >= 0 && precio <= 999999.99
    })
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
        detail: `Define un precio válido en: ${nombres}.`,
        life: 4000,
      })
      return false
    }

    guardandoCategorias.value = true
    try {
      await perfilTecnicoApi.actualizarCategorias(id, categoriasSeleccionadas.value)
      const tarifas = categoriasSeleccionadas.value.flatMap((categoriaId) =>
        tarifasPorCategoria[categoriaId].map(
          (rango): TarifaTecnico => ({
            id: rango.id,
            tecnico_id: id,
            categoria_id: categoriaId,
            precio: Number(rango.precio),
            unidad_cobro: (rango.unidad || 'por_visita') as UnidadCobro,
            tipo_servicio: rango.tipoServicio.trim(),
            negociable: rango.negociable,
          }),
        ),
      )
      await perfilTecnicoApi.actualizarTarifas(id, tarifas)
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
    agregarTarifa,
    eliminarTarifa,
    cargandoCatalogo,
    guardandoCategorias,
    guardarCategorias,
  }
}