import { computed, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../auth/useAuthz'
import { api } from '../../services/api'
import type { Certificacion, CrearCertificacionPayload, EstadoCertificacion } from '../../types/certificaciones'

export const ETIQUETAS_ESTADO: Record<EstadoCertificacion, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const SEVERIDAD_ESTADO: Record<EstadoCertificacion, 'warn' | 'success' | 'danger'> = {
  pendiente: 'warn',
  aprobada: 'success',
  rechazada: 'danger',
}

export function formatearFecha(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function useCertificaciones() {
  const toast = useToast()
  const { usuario } = useAuthz()
  const usuarioId = computed(() => usuario.value?.id)

  const certificaciones = ref<Certificacion[]>([])
  const cargando = ref(false)
  const guardando = ref(false)
  const eliminando = ref(false)
  const formVisible = ref(false)
  const confirmarEliminarVisible = ref(false)
  const certificacionActiva = ref<Certificacion | null>(null)

  const form = reactive({ tipo_documento: '', url_documento: '' })

  function resetForm() {
    form.tipo_documento = ''
    form.url_documento = ''
  }

  async function cargar() {
    const id = usuarioId.value
    if (!id) return
    cargando.value = true
    try {
      certificaciones.value = await api.get<Certificacion[]>(`/perfiles-tecnico/${id}/certificaciones`)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar las certificaciones',
        life: 4000,
      })
      certificaciones.value = []
    } finally {
      cargando.value = false
    }
  }

  function abrirCrear() {
    resetForm()
    certificacionActiva.value = null
    formVisible.value = true
  }

  async function guardar() {
    const tipo = form.tipo_documento.trim()
    const url = form.url_documento.trim()
    const id = usuarioId.value
    if (!tipo || !url || !id) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'El tipo de documento y la URL son obligatorios.',
        life: 3000,
      })
      return
    }
    guardando.value = true
    try {
      const payload: CrearCertificacionPayload = { tipo_documento: tipo, url_documento: url }
      await api.post<Certificacion>(`/perfiles-tecnico/${id}/certificaciones`, payload)
      toast.add({ severity: 'success', summary: 'Certificación agregada', life: 3000 })
      formVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo guardar la certificación',
        life: 4000,
      })
    } finally {
      guardando.value = false
    }
  }

  function pedirEliminar(certificacion: Certificacion) {
    certificacionActiva.value = certificacion
    confirmarEliminarVisible.value = true
  }

  async function eliminar() {
    const certificacion = certificacionActiva.value
    const id = usuarioId.value
    if (!certificacion || !id) return
    eliminando.value = true
    try {
      await api.delete<{ eliminado: boolean }>(
        `/perfiles-tecnico/${id}/certificaciones/${certificacion.id}`,
      )
      toast.add({ severity: 'success', summary: 'Certificación eliminada', life: 3000 })
      confirmarEliminarVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo eliminar la certificación',
        life: 4000,
      })
    } finally {
      eliminando.value = false
    }
  }

  return {
    certificaciones,
    cargando,
    guardando,
    eliminando,
    formVisible,
    confirmarEliminarVisible,
    certificacionActiva,
    form,
    cargar,
    abrirCrear,
    guardar,
    pedirEliminar,
    eliminar,
  }
}