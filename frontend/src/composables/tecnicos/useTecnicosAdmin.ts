import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { tecnicosApi } from '../../services/tecnicos'
import type { DetalleTecnico, TecnicoAdminLista } from '../../types/tecnicos'
import type { EstadoCertificacion } from '../../types/certificaciones'

export function useTecnicosAdmin() {
  const toast = useToast()
  const tecnicos = ref<TecnicoAdminLista[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const cargando = ref(false)
  const busqueda = ref('')
  let temporizadorBusqueda: ReturnType<typeof setTimeout> | undefined

  const tecnicoActivo = ref<TecnicoAdminLista | null>(null)
  const detalle = ref<DetalleTecnico | null>(null)
  const detalleVisible = ref(false)
  const cargandoDetalle = ref(false)
  const procesando = ref(false)

  async function cargar() {
    cargando.value = true
    try {
      const respuesta = await tecnicosApi.listar(page.value, limit.value, busqueda.value.trim())
      tecnicos.value = respuesta.data
      total.value = respuesta.total
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar los técnicos',
        life: 4000,
      })
      tecnicos.value = []
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

  function notificarExito(detail: string) {
    toast.add({ severity: 'success', summary: 'Listo', detail, life: 3000 })
  }

  function notificarError(error: unknown, contexto: string) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : contexto,
      life: 4000,
    })
  }

  async function abrirVer(tecnico: TecnicoAdminLista) {
    tecnicoActivo.value = tecnico
    detalleVisible.value = true
    cargandoDetalle.value = true
    detalle.value = null
    try {
      detalle.value = await tecnicosApi.obtenerDetalle(tecnico.id)
    } catch (error) {
      notificarError(error, 'No se pudo cargar el detalle del técnico')
    } finally {
      cargandoDetalle.value = false
    }
  }

  async function verificar() {
    const tecnico = tecnicoActivo.value
    if (!tecnico) return
    procesando.value = true
    const ahoraVerificado = detalle.value?.perfil.verificado === false
    try {
      if (ahoraVerificado) {
        await tecnicosApi.verificar(tecnico.id, ahoraVerificado)
        notificarExito(`${tecnico.nombres} fue marcado como verificado`)
      } else {
        await tecnicosApi.verificar(tecnico.id, ahoraVerificado)
        notificarExito(`Se retiró la verificación de ${tecnico.nombres}`)
      }
      if (tecnicoActivo.value) await abrirVer(tecnicoActivo.value)
      await cargar()
    } catch (error) {
      notificarError(error, 'No se pudo cambiar la verificación')
    } finally {
      procesando.value = false
    }
  }

  async function revisarCertificacion(certificacionId: string, estado: EstadoCertificacion) {
    const tecnico = tecnicoActivo.value
    if (!tecnico) return
    procesando.value = true
    try {
      await tecnicosApi.revisarCertificacion(tecnico.id, certificacionId, estado)
      notificarExito(estado === 'aprobada' ? 'Certificación aprobada' : 'Certificación rechazada')
      if (tecnicoActivo.value) await abrirVer(tecnicoActivo.value)
    } catch (error) {
      notificarError(error, 'No se pudo revisar la certificación')
    } finally {
      procesando.value = false
    }
  }

  function confirmarCambiarEstado(tecnico: TecnicoAdminLista) {
    tecnicoActivo.value = tecnico
    cambiarEstado()
  }

  async function cambiarEstado() {
    const tecnico = tecnicoActivo.value
    if (!tecnico) return
    procesando.value = true
    const nuevoEstado = tecnico.usuario_estado === 'suspendido' ? 'activo' : 'suspendido'
    try {
      const actualizado = await tecnicosApi.cambiarEstado(tecnico.id, nuevoEstado)
      notificarExito(`${tecnico.nombres} ahora está ${nuevoEstado === 'activo' ? 'activo' : 'suspendido'}`)
      const tecnicoActualizado: TecnicoAdminLista = {
        ...tecnico,
        usuario_estado: actualizado.estado as 'activo' | 'suspendido',
      }
      const indice = tecnicos.value.findIndex((t) => t.id === tecnico.id)
      if (indice >= 0) tecnicos.value[indice] = tecnicoActualizado
      await abrirVer(tecnicoActualizado)
    } catch (error) {
      notificarError(error, 'No se pudo actualizar el estado')
    } finally {
      procesando.value = false
    }
  }

  return {
    tecnicos,
    total,
    page,
    limit,
    cargando,
    busqueda,
    tecnicoActivo,
    detalle,
    detalleVisible,
    cargandoDetalle,
    procesando,
    cargar,
    onPage,
    onCambioBusqueda,
    limpiarBusqueda,
    abrirVer,
    verificar,
    revisarCertificacion,
    confirmarCambiarEstado,
  }
}