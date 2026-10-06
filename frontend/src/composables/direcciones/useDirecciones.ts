import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { direccionesApi } from '../../services/direcciones'
import type { Direccion, DireccionPayload } from '../../types/direcciones'

export function useDirecciones() {
  const toast = useToast()
  const direcciones = ref<Direccion[]>([])
  const cargando = ref(false)
  const guardando = ref(false)
  const eliminando = ref(false)
  const direccionActiva = ref<Direccion | null>(null)
  const formVisible = ref(false)
  const confirmarPrincipalVisible = ref(false)
  const confirmarEliminarVisible = ref(false)

  const form = reactive({
    etiqueta: '',
    direccion_texto: '',
    referencia: '',
    ciudad: 'Manta',
    latitud: '',
    longitud: '',
    es_principal: false,
  })

  function resetForm() {
    form.etiqueta = ''
    form.direccion_texto = ''
    form.referencia = ''
    form.ciudad = 'Manta'
    form.latitud = ''
    form.longitud = ''
    form.es_principal = false
  }

  async function cargar() {
    cargando.value = true
    try {
      direcciones.value = await direccionesApi.listar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudieron cargar las direcciones',
        life: 4000,
      })
      direcciones.value = []
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 800))
      cargando.value = false
    }
  }

  function abrirCrear() {
    resetForm()
    direccionActiva.value = null
    formVisible.value = true
  }

  function abrirEditar(direccion: Direccion) {
    form.etiqueta = direccion.etiqueta ?? ''
    form.direccion_texto = direccion.direccion_texto
    form.referencia = direccion.referencia ?? ''
    form.ciudad = direccion.ciudad
    form.latitud = String(direccion.latitud)
    form.longitud = String(direccion.longitud)
    form.es_principal = direccion.es_principal
    direccionActiva.value = direccion
    formVisible.value = true
  }

  async function guardar() {
    const texto = form.direccion_texto.trim()
    const lat = Number(form.latitud)
    const lon = Number(form.longitud)
    if (!texto || form.latitud.trim() === '' || form.longitud.trim() === '' || isNaN(lat) || isNaN(lon)) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'La dirección, latitud y longitud deben ser valores válidos.',
        life: 3000,
      })
      return
    }
    const payload: DireccionPayload = {
      etiqueta: form.etiqueta.trim() || undefined,
      direccion_texto: texto,
      referencia: form.referencia.trim() || undefined,
      ciudad: form.ciudad.trim() || 'Manta',
      latitud: lat,
      longitud: lon,
      es_principal: form.es_principal,
    }
    guardando.value = true
    try {
      if (direccionActiva.value) {
        await direccionesApi.actualizar(direccionActiva.value.id, payload)
        toast.add({ severity: 'success', summary: 'Dirección actualizada', life: 3000 })
      } else {
        await direccionesApi.crear(payload)
        toast.add({ severity: 'success', summary: 'Dirección agregada', life: 3000 })
      }
      formVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo guardar la dirección',
        life: 4000,
      })
    } finally {
      guardando.value = false
    }
  }

  function pedirPrincipal(direccion: Direccion) {
    direccionActiva.value = direccion
    confirmarPrincipalVisible.value = true
  }

  async function establecerPrincipal() {
    const direccion = direccionActiva.value
    if (!direccion) return
    try {
      await direccionesApi.establecerPrincipal(direccion.id)
      toast.add({ severity: 'success', summary: 'Dirección principal actualizada', life: 3000 })
      confirmarPrincipalVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo actualizar la dirección principal',
        life: 4000,
      })
    }
  }

  function pedirEliminar(direccion: Direccion) {
    direccionActiva.value = direccion
    confirmarEliminarVisible.value = true
  }

  async function eliminar() {
    const direccion = direccionActiva.value
    if (!direccion) return
    eliminando.value = true
    try {
      await direccionesApi.eliminar(direccion.id)
      toast.add({ severity: 'success', summary: 'Dirección eliminada', life: 3000 })
      confirmarEliminarVisible.value = false
      await cargar()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo eliminar la dirección',
        life: 4000,
      })
    } finally {
      eliminando.value = false
    }
  }

  return {
    direcciones,
    cargando,
    guardando,
    eliminando,
    direccionActiva,
    formVisible,
    confirmarPrincipalVisible,
    confirmarEliminarVisible,
    form,
    cargar,
    abrirCrear,
    abrirEditar,
    guardar,
    pedirPrincipal,
    establecerPrincipal,
    pedirEliminar,
    eliminar,
  }
}
