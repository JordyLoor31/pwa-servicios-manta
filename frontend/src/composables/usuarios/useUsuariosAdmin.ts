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

  async function cargar() {
    cargando.value = true
    try {
      const respuesta = await api.get<UsuariosPaginados>(
        `/usuarios?page=${page.value}&limit=${limit.value}`,
      )
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

  return {
    usuarios,
    total,
    page,
    limit,
    cargando,
    cargar,
    onPage,
  }
}