import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { api } from '../../services/api'
import type { UsuarioLista, UsuariosPaginados } from '../../types/usuarios'

export function useUsuariosAdmin() {
  const toast = useToast()
  const usuarios = ref<UsuarioLista[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const cargando = ref(false)
  const cambiandoEstado = ref(false)
  const usuarioActivo = ref<UsuarioLista | null>(null)
  const detalleVisible = ref(false)
  const confirmarEstadoVisible = ref(false)
  const busqueda = ref('')
  let temporizadorBusqueda: ReturnType<typeof setTimeout> | undefined

  async function cargar() {
    cargando.value = true
    try {
      const q = busqueda.value.trim()
      const ruta = `/usuarios?page=${page.value}&limit=${limit.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`
      const respuesta = await api.get<UsuariosPaginados>(ruta)
      usuarios.value = respuesta.data
      total.value = respuesta.total
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar los usuarios',
        life: 4000,
      })
      usuarios.value = []
      total.value = 0
    } finally {
      cargando.value = false
    }
  }

  function onPage(evento: { first: number; rows: number; page: number }) {
    page.value = evento.page + 1
    limit.value = evento.rows
    cargar()
  }

  function onCambioBusqueda(valor: string) {
    busqueda.value = valor
    clearTimeout(temporizadorBusqueda)
    temporizadorBusqueda = setTimeout(() => {
      page.value = 1
      cargar()
    }, 400)
  }

  function limpiarBusqueda() {
    busqueda.value = ''
    page.value = 1
    cargar()
  }

  function abrirVer(usuario: UsuarioLista) {
    usuarioActivo.value = usuario
    detalleVisible.value = true
  }

  function confirmarCambiarEstado(usuario: UsuarioLista) {
    usuarioActivo.value = usuario
    confirmarEstadoVisible.value = true
  }

  async function cambiarEstado() {
    const usuario = usuarioActivo.value
    if (!usuario) return
    cambiandoEstado.value = true
    const nuevoEstado = usuario.estado === 'suspendido' ? 'activo' : 'suspendido'
    try {
      const actualizado = await api.patch<UsuarioLista>(`/usuarios/${usuario.id}/estado`, {
        estado: nuevoEstado,
      })
      const indice = usuarios.value.findIndex((u) => u.id === usuario.id)
      if (indice >= 0) usuarios.value[indice] = actualizado
      toast.add({
        severity: 'success',
        summary: 'Estado actualizado',
        detail: `${usuario.nombres} ahora está ${nuevoEstado === 'activo' ? 'activo' : 'suspendido'}`,
        life: 3000,
      })
      confirmarEstadoVisible.value = false
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo actualizar el estado',
        life: 4000,
      })
    } finally {
      cambiandoEstado.value = false
    }
  }

  return {
    usuarios,
    total,
    page,
    limit,
    cargando,
    cambiandoEstado,
    usuarioActivo,
    detalleVisible,
    confirmarEstadoVisible,
    busqueda,
    cargar,
    onPage,
    onCambioBusqueda,
    limpiarBusqueda,
    abrirVer,
    confirmarCambiarEstado,
    cambiarEstado,
  }
}