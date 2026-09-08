import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { api } from '../../services/api'
import type { CategoriaForm, CategoriaModo, CategoriaServicio } from '../../types/categorias'

const FORM_VACIO: CategoriaForm = { nombre: '', descripcion: '', icono: '', activa: true }

export function useCategoriasAdmin() {
  const toast = useToast()
  const categorias = ref<CategoriaServicio[]>([])
  const cargando = ref(true)
  const guardando = ref(false)
  const eliminando = ref(false)

  const dialogoVisible = ref(false)
  const modo = ref<CategoriaModo>('crear')
  const form = ref<CategoriaForm>({ ...FORM_VACIO })

  const categoriaActiva = ref<CategoriaServicio | null>(null)
  const eliminarVisible = ref(false)
  const editingId = ref<string | null>(null)

  function notificarError(error: unknown, contexto: string) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : contexto,
      life: 4000,
    })
  }

  async function cargarCategorias() {
    cargando.value = true
    try {
      categorias.value = await api.get<CategoriaServicio[]>('/categorias-servicio')
    } catch (error) {
      notificarError(error, 'No se pudieron cargar las categorías')
    } finally {
      cargando.value = false
    }
  }

  function abrirCrear() {
    modo.value = 'crear'
    editingId.value = null
    form.value = { ...FORM_VACIO }
    dialogoVisible.value = true
  }

  function abrirEditar(categoria: CategoriaServicio) {
    modo.value = 'editar'
    editingId.value = categoria.id
    form.value = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      icono: categoria.icono ?? '',
      activa: categoria.activa,
    }
    dialogoVisible.value = true
  }

  function abrirVer(categoria: CategoriaServicio) {
    modo.value = 'ver'
    editingId.value = categoria.id
    form.value = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      icono: categoria.icono ?? '',
      activa: categoria.activa,
    }
    dialogoVisible.value = true
  }

  function cerrarDialogo() {
    dialogoVisible.value = false
  }

  async function guardar() {
    const nombre = form.value.nombre.trim()
    if (!nombre) {
      toast.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es obligatorio.', life: 3000 })
      return
    }
    guardando.value = true
    try {
      const payload: CategoriaForm = {
        nombre,
        descripcion: form.value.descripcion?.trim() || undefined,
        icono: form.value.icono?.trim() || undefined,
        activa: form.value.activa,
      }
      if (modo.value === 'crear') {
        await api.post('/categorias-servicio', payload)
        toast.add({ severity: 'success', summary: 'Guardado', detail: 'Categoría creada.', life: 3000 })
      } else if (editingId.value) {
        await api.put(`/categorias-servicio/${editingId.value}`, payload)
        toast.add({ severity: 'success', summary: 'Guardado', detail: 'Categoría actualizada.', life: 3000 })
      }
      cerrarDialogo()
      await cargarCategorias()
    } catch (error) {
      notificarError(error, 'No se pudo guardar la categoría')
    } finally {
      guardando.value = false
    }
  }

  function confirmarEliminar(categoria: CategoriaServicio) {
    categoriaActiva.value = categoria
    eliminarVisible.value = true
  }

  async function eliminar() {
    const id = categoriaActiva.value?.id
    if (!id) return
    eliminando.value = true
    try {
      await api.delete(`/categorias-servicio/${id}`)
      toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Categoría eliminada.', life: 3000 })
      eliminarVisible.value = false
      await cargarCategorias()
    } catch (error) {
      notificarError(error, 'No se pudo eliminar la categoría')
    } finally {
      eliminando.value = false
    }
  }

  onMounted(cargarCategorias)

  return {
    categorias,
    cargando,
    guardando,
    eliminando,
    dialogoVisible,
    modo,
    form,
    categoriaActiva,
    eliminarVisible,
    abrirCrear,
    abrirEditar,
    abrirVer,
    cerrarDialogo,
    guardar,
    confirmarEliminar,
    eliminar,
  }
}