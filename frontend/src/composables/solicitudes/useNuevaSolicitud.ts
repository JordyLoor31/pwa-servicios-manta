import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { categoriasApi } from '../../services/categorias'
import { solicitudesApi } from '../../services/solicitudes'
import { useDirecciones } from '../direcciones/useDirecciones'
import type { CategoriaServicio } from '../../types/categorias'
import type { Solicitud, TecnicoDirectorio } from '../../types/solicitudes'

export function useNuevaSolicitud() {
  const toast = useToast()
  const horasBase = Array.from({ length: 48 }, (_, indice) => {
    const hora = Math.floor(indice / 2)
    return `${String(hora).padStart(2, '0')}:${indice % 2 === 0 ? '00' : '30'}`
  })

  const categorias = ref<CategoriaServicio[]>([])
  const categoriasSeleccionadas = ref<string[]>([])
  const categoriasTags = ref<string[]>([])
  const categoriasPersonalizadas = ref<string[]>([])
  const categoriaOtro = ref(false)
  const categoriaPersonalizadaTexto = ref('')
  const fechaServicio = ref<Date>(new Date())
  const tecnicos = ref<TecnicoDirectorio[]>([])
  const cargandoTecnicos = ref(false)
  const horas = ref<string[]>([...horasBase])
  const horasValidas = computed(() => horas.value.filter(horaEsFutura))
  const horaBusqueda = ref(horasBase[0])
  const enviando = ref(false)
  const duracionOferta = ref<30 | 180 | 360 | 540>(30)
  const ofertaHastaFinDia = ref(false)
  const serviciosPorCategoria = ref<Record<string, string[]>>({})
  const idempotencyKey = ref('')

  const form = ref({ tecnico_id: '', descripcion: '', direccion: '' })
  const { direcciones, cargar: cargarDirecciones } = useDirecciones()
  const direccionSeleccionadaId = ref('')
  const direccionLatitud = ref<number | undefined>()
  const direccionLongitud = ref<number | undefined>()

  function actualizarServicios(categoriaId: string, valores: string[]) {
    serviciosPorCategoria.value[categoriaId] = [...new Set(
      valores.map((valor) => valor.trim().slice(0, 150)).filter(Boolean),
    )]
  }

  function actualizarCategoriasTags(valores: string[]) {
    const nombresPermitidos = new Set(categorias.value.map((categoria) => categoria.nombre))
    const etiquetas = [...new Set(valores.map((valor) => valor.trim()).filter(Boolean))]
    categoriaOtro.value = etiquetas.includes('Otro')
    categoriasTags.value = etiquetas.filter((etiqueta) =>
      nombresPermitidos.has(etiqueta) || etiqueta === 'Otro',
    )
    categoriasSeleccionadas.value = categorias.value
      .filter((categoria) => categoriasTags.value.includes(categoria.nombre))
      .map((categoria) => categoria.id)
  }

  function agregarCategoriaPersonalizada() {
    const nombre = categoriaPersonalizadaTexto.value.trim().slice(0, 80)
    if (!nombre) return
    categoriasPersonalizadas.value = [...new Set([...categoriasPersonalizadas.value, nombre])]
    categoriaPersonalizadaTexto.value = ''
  }

  function eliminarCategoriaPersonalizada(nombre: string) {
    categoriasPersonalizadas.value = categoriasPersonalizadas.value.filter((actual) => actual !== nombre)
  }

  function horaEsFutura(hora: string): boolean {
    const hoy = new Date()
    const fechaEsHoy = aFechaISO(fechaServicio.value) === aFechaISO(hoy)
    if (!fechaEsHoy) return true
    const [horasTexto, minutosTexto] = hora.split(':')
    const minutosHora = Number(horasTexto) * 60 + Number(minutosTexto)
    return minutosHora > hoy.getHours() * 60 + hoy.getMinutes()
  }

  function actualizarHorasValidas() {
    const horasDisponibles = horas.value.filter(horaEsFutura)
    if (!horasDisponibles.includes(horaBusqueda.value)) {
      horaBusqueda.value = horasDisponibles[0] ?? ''
    }
  }

  async function cargarCategorias() {
    if (categorias.value.length > 0) return
    try {
      categorias.value = await categoriasApi.listarActivas()
    } catch {
      categorias.value = []
    }

  }

  async function cargarTecnicos() {
    cargandoTecnicos.value = true
    try {
      tecnicos.value = await solicitudesApi.tecnicosDisponiblesPorDia(
        fechaServicio.value.getDay(),
        categoriasSeleccionadas.value,
      )
      if (form.value.tecnico_id && !tecnicos.value.some((t) => t.id === form.value.tecnico_id)) {
        form.value.tecnico_id = ''
      }
    } catch {
      tecnicos.value = []
      horaBusqueda.value = horas.value[0] ?? ''
    } finally {
      cargandoTecnicos.value = false
    }
  }

  async function cargarHoras() {
    const tecnicoId = form.value.tecnico_id
    if (!tecnicoId) {
      horaBusqueda.value = horas.value[0] ?? ''
      actualizarHorasValidas()
      return
    }
    try {
      const horasDisponibles = await solicitudesApi.horariosDisponiblesParaTecnico(
        fechaServicio.value.getDay(),
        tecnicoId,
        categoriasSeleccionadas.value,
      )
      horas.value = horasDisponibles.length > 0 ? horasDisponibles : [...horasBase]
      actualizarHorasValidas()
      if (!horasValidas.value.includes(horaBusqueda.value)) {
        horaBusqueda.value = horasValidas.value[0] ?? ''
      }
    } catch {
      horas.value = [...horasBase]
      actualizarHorasValidas()
    }
  }

  watch(fechaServicio, () => {
    actualizarHorasValidas()
    void cargarTecnicos()
  })

  watch(categoriasSeleccionadas, () => {
    const actuales = new Set(categoriasSeleccionadas.value)
    for (const id of Object.keys(serviciosPorCategoria.value)) {
      if (!actuales.has(id)) delete serviciosPorCategoria.value[id]
    }
    for (const id of categoriasSeleccionadas.value) {
      if (!serviciosPorCategoria.value[id]) serviciosPorCategoria.value[id] = []
    }
    void cargarTecnicos()
  }, { deep: true })

  watch(
    () => form.value.tecnico_id,
    () => {
      void cargarHoras()
    },
  )

  watch(direccionSeleccionadaId, (id) => {
    const direccion = direcciones.value.find((d) => d.id === id)
    if (direccion) {
      form.value.direccion = direccion.direccion_texto
      direccionLatitud.value = direccion.latitud
      direccionLongitud.value = direccion.longitud
    }
  })

  function iniciar() {
    form.value = { tecnico_id: '', descripcion: '', direccion: '' }
    categoriasSeleccionadas.value = []
    categoriasTags.value = []
    categoriasPersonalizadas.value = []
    categoriaOtro.value = false
    categoriaPersonalizadaTexto.value = ''
    fechaServicio.value = new Date()
    horas.value = [...horasBase]
    horaBusqueda.value = horasBase[0]
    direccionSeleccionadaId.value = ''
    duracionOferta.value = 30
    ofertaHastaFinDia.value = false
    serviciosPorCategoria.value = {}
    direccionLatitud.value = undefined
    direccionLongitud.value = undefined
    idempotencyKey.value =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    void cargarCategorias()
    void cargarTecnicos()
    void cargarDirecciones()
  }

  function aFechaISO(fecha: Date) {
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  async function crear(): Promise<Solicitud | null> {
    const descripcion = form.value.descripcion.trim()
    const tiposServicio = Object.values(serviciosPorCategoria.value)
      .flat()
      .map((tipo) => tipo.trim())
      .filter(Boolean)
    const tiposPorCategoria: Record<string, string[]> = {}
    for (const [categoriaId, tipos] of Object.entries(serviciosPorCategoria.value)) {
      tiposPorCategoria[categoriaId] = tipos
        .map((tipo) => tipo.trim())
        .filter(Boolean)
    }
    for (const nombreCategoria of categoriasPersonalizadas.value) {
      tiposPorCategoria[nombreCategoria] = (serviciosPorCategoria.value[nombreCategoria] ?? [])
        .map((tipo) => tipo.trim())
        .filter(Boolean)
    }
    if (
      descripcion.length < 10 ||
      !horaBusqueda.value ||
      (categoriasSeleccionadas.value.length === 0 && categoriasPersonalizadas.value.length === 0) ||
      tiposServicio.length === 0
    ) {
      toast.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona una categoría, al menos un tipo de servicio, una hora y describe la necesidad (mínimo 10 caracteres).',
        life: 3000,
      })
      return null
    }
    if (!horaEsFutura(horaBusqueda.value)) {
      toast.add({
        severity: 'warn',
        summary: 'Hora no válida',
        detail: 'La hora de llegada debe ser posterior a la hora actual.',
        life: 3000,
      })
      return null
    }
    if (direcciones.value.length > 0 && !direccionSeleccionadaId.value) {
      toast.add({
        severity: 'warn',
        summary: 'Elegir dirección',
        detail: 'Selecciona una de tus direcciones para el servicio.',
        life: 3000,
      })
      return null
    }
    enviando.value = true
    try {
      const payload: {
        tecnico_id?: string
        descripcion: string
        direccion?: string
        direccion_latitud?: number
        direccion_longitud?: number
        fecha_propuesta: string
        hora_propuesta: string
        duracion_oferta_minutos: 30 | 180 | 360 | 540
        oferta_hasta_fin_dia: boolean
        categoria_ids: string[]
        categorias_personalizadas?: string[]
        tipos_servicio: string[]
        tipos_servicio_por_categoria: Record<string, string[]>
      } = {
        descripcion,
        direccion: form.value.direccion.trim() || undefined,
        direccion_latitud: direccionLatitud.value,
        direccion_longitud: direccionLongitud.value,
        fecha_propuesta: aFechaISO(fechaServicio.value),
        hora_propuesta: horaBusqueda.value,
        duracion_oferta_minutos: duracionOferta.value,
        oferta_hasta_fin_dia: ofertaHastaFinDia.value,
        categoria_ids: categoriasSeleccionadas.value,
        categorias_personalizadas: categoriasPersonalizadas.value,
        tipos_servicio: tiposServicio,
        tipos_servicio_por_categoria: tiposPorCategoria,
      }
      if (form.value.tecnico_id) payload.tecnico_id = form.value.tecnico_id
      const creada = await solicitudesApi.crear(payload, idempotencyKey.value)
      toast.add({ severity: 'success', summary: 'Solicitud enviada', life: 3000 })
      return creada
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo enviar la solicitud',
        life: 4000,
      })
      return null
    } finally {
      enviando.value = false
    }
  }

  return {
    categorias,
    categoriasSeleccionadas,
    categoriasTags,
    categoriasPersonalizadas,
    categoriaOtro,
    categoriaPersonalizadaTexto,
    fechaServicio,
    tecnicos,
    cargandoTecnicos,
    horas,
    horasValidas,
    horaBusqueda,
    duracionOferta,
    ofertaHastaFinDia,
    serviciosPorCategoria,
    enviando,
    form,
    direcciones,
    direccionSeleccionadaId,

    cargarCategorias,
    iniciar,
    crear,
    actualizarHorasValidas,
    horaEsFutura,
    actualizarServicios,
    actualizarCategoriasTags,
    agregarCategoriaPersonalizada,
    eliminarCategoriaPersonalizada,
  }
}
