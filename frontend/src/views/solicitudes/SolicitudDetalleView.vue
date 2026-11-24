<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Rating from 'primevue/rating'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AppHeader from '../../components/layout/AppHeader.vue'
import PerfilTecnicoPublicoDialog from '../../components/perfil-tecnico/PerfilTecnicoPublicoDialog.vue'
import ResenasCarousel from '../../components/perfil-tecnico/ResenasCarousel.vue'
import CalificarServicioDialog from '../../components/solicitudes/CalificarServicioDialog.vue'
import ConfirmarCompletacionDialog from '../../components/solicitudes/ConfirmarCompletacionDialog.vue'
import PostularDialog from '../../components/solicitudes/PostularDialog.vue'
import { useAuthz } from '../../composables/auth/useAuthz'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import { solicitudesApi } from '../../services/solicitudes'
import type { PerfilPublico } from '../../types/perfil-tecnico'
import type { PostulacionSolicitud, Solicitud } from '../../types/solicitudes'
import { estadoLabel, estadoSeveridad, formatearPropuestaLlegada } from '../../utils/solicitudes'
import { urlOpenStreetMap } from '../../utils/openStreetMap'

interface EventoTimeline {
  fecha: number
  fechaTexto: string
  titulo: string
  descripcion?: string
  icon: string
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { usuario } = useAuthz()

function tiposUnicosCategoria(categoriaId: string): string[] {
  const categorias = solicitud.value?.categorias ?? []
  const asignados = new Set<string>()
  for (const categoria of categorias) {
    const tipos = solicitud.value?.tipos_servicio_por_categoria?.[categoria.id] ?? []
    if (categoria.id === categoriaId) {
      return tipos.filter((tipo) => {
        if (asignados.has(tipo)) return false
        asignados.add(tipo)
        return true
      })
    }
    tipos.forEach((tipo) => asignados.add(tipo))
  }
  return []
}

const solicitud = ref<Solicitud | null>(null)
const cargando = ref(true)
const error = ref('')
const postulaciones = ref<PostulacionSolicitud[]>([])
const cargandoPostulaciones = ref(false)
const postulado = ref(false)
const perfilTecnico = ref<PerfilPublico | null>(null)
const cargandoPerfil = ref(false)
const errorPerfil = ref('')

const perfilVisible = ref(false)
const perfilTecnicoId = ref<string | null>(null)
const calificarVisible = ref(false)
const postularVisible = ref(false)
const completarVisible = ref(false)
const cancelarVisible = ref(false)
const rechazarVisible = ref(false)
const motivoRechazo = ref('')
const procesando = ref(false)
const accionPostulacionId = ref<string | null>(null)
const accionPostulacionTipo = ref<'aceptar' | 'rechazar' | null>(null)

const solicitudId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const esCliente = computed(() => usuario.value?.rol === 'cliente')
const esTecnico = computed(() => usuario.value?.rol === 'tecnico')
const esAdmin = computed(() => usuario.value?.rol === 'admin')

const esMiSolicitud = computed(
  () => esCliente.value && solicitud.value?.cliente.id === usuario.value?.id,
)
const esMiTrabajo = computed(
  () => esTecnico.value && solicitud.value?.tecnico?.id === usuario.value?.id,
)
const puedePostular = computed(
  () =>
    esTecnico.value &&
    solicitud.value?.estado === 'pendiente' &&
    !solicitud.value?.tecnico &&
    !postulado.value,
)
const puedeCompletar = computed(
  () => esMiTrabajo.value && solicitud.value?.estado === 'aceptada',
)
const puedeRechazarOferta = computed(
  () =>
    esMiTrabajo.value &&
    solicitud.value?.estado === 'pendiente' &&
    Boolean(solicitud.value?.tecnico),
)
const puedeCancelar = computed(
  () =>
    esMiSolicitud.value &&
    (solicitud.value?.estado === 'pendiente' || solicitud.value?.estado === 'aceptada'),
)
const puedeCalificar = computed(
  () =>
    esMiSolicitud.value &&
    solicitud.value?.estado === 'completada' &&
    !solicitud.value?.calificacion,
)
const rutaVolver = computed(() => {
  if (esTecnico.value) return '/solicitudes/recibidas'
  if (esCliente.value) return '/solicitudes'
  return '/'
})

const eventos = computed<EventoTimeline[]>(() => {
  const actual = solicitud.value
  if (!actual) return []

  const lista: EventoTimeline[] = []
  const agregar = (
    valor: string | Date | null | undefined,
    titulo: string,
    descripcion: string | undefined,
    icon: string,
  ) => {
    if (!valor) return
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return
    lista.push({
      fecha: fecha.getTime(),
      fechaTexto: fechaHora(fecha),
      titulo,
      descripcion,
      icon,
    })
  }

  agregar(
    actual.fecha_solicitud,
    'Solicitud creada',
    'El cliente publicó la solicitud para recibir propuestas.',
    'pi pi-file-plus',
  )

  if (actual.fecha_propuesta && actual.hora_propuesta) {
    const inicio = new Date(
      `${actual.fecha_propuesta.slice(0, 10)}T${actual.hora_propuesta.slice(0, 5)}:00`,
    )
    const fin = actual.hora_fin_estimada
      ? ` y finalizar alrededor de las ${actual.hora_fin_estimada.slice(0, 5)}`
      : ''
    agregar(
      inicio,
      'Llegada propuesta',
      `${formatearPropuestaLlegada(actual.fecha_propuesta, actual.hora_propuesta)}${fin}.`,
      'pi pi-clock',
    )
  }

  if (
    actual.fecha_expiracion_oferta &&
    new Date(actual.fecha_expiracion_oferta).getTime() <= Date.now()
  ) {
    agregar(
      actual.fecha_expiracion_oferta,
      'Fin del plazo de la oferta',
      'Los técnicos dejaron de poder enviar propuestas.',
      'pi pi-hourglass',
    )
  }

  agregar(
    actual.fecha_aceptacion,
    'Servicio aceptado',
    actual.tecnico
      ? `El trabajo fue asignado a ${actual.tecnico.nombres} ${actual.tecnico.apellidos}.`
      : undefined,
    'pi pi-check-circle',
  )

  agregar(
    actual.fecha_completada,
    'Servicio completado',
    'El técnico finalizó el trabajo y el cliente confirmó la completación.',
    'pi pi-flag',
  )

  if (actual.calificacion) {
    agregar(
      actual.calificacion.fecha_creacion,
      'Servicio calificado',
      `El cliente otorgó ${actual.calificacion.calificacion} de 5 estrellas.`,
      'pi pi-star-fill',
    )
  }

  return lista.sort((a, b) => a.fecha - b.fecha)
})

onMounted(cargarTodo)

watch(solicitudId, () => {
  solicitud.value = null
  postulaciones.value = []
  perfilTecnico.value = null
  void cargarTodo()
})

async function cargarTodo() {
  if (!solicitudId.value) return
  if (!solicitud.value) cargando.value = true
  error.value = ''
  try {
    solicitud.value = await solicitudesApi.obtener(solicitudId.value)
    postulado.value = Boolean(solicitud.value.postulado_por_mi)
    await Promise.all([cargarPostulaciones(), cargarPerfilTecnico()])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la solicitud'
  } finally {
    cargando.value = false
  }
}

async function cargarPostulaciones() {
  if (!solicitud.value || !esMiSolicitud.value || solicitud.value.estado !== 'pendiente') {
    postulaciones.value = []
    return
  }
  cargandoPostulaciones.value = true
  try {
    postulaciones.value = await solicitudesApi.postulaciones(solicitud.value.id)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err instanceof Error ? err.message : 'No se pudieron cargar las postulaciones',
      life: 4000,
    })
  } finally {
    cargandoPostulaciones.value = false
  }
}

async function cargarPerfilTecnico() {
  const tecnicoId = solicitud.value?.tecnico?.id
  if (!tecnicoId || esTecnico.value) {
    perfilTecnico.value = null
    return
  }
  cargandoPerfil.value = true
  errorPerfil.value = ''
  try {
    perfilTecnico.value = await perfilTecnicoApi.obtenerPerfilPublico(tecnicoId)
  } catch (err) {
    perfilTecnico.value = null
    errorPerfil.value =
      err instanceof Error ? err.message : 'No se pudo cargar el perfil del técnico'
  } finally {
    cargandoPerfil.value = false
  }
}

function volver() {
  void router.push(rutaVolver.value)
}

function fechaHora(valor: string | Date | null | undefined) {
  if (!valor) return ''
  return new Date(valor).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function moneda(valor: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor)
}

function distanciaTexto(postulacion: PostulacionSolicitud) {
  if (postulacion.tecnico_distancia_km == null) return 'Distancia no disponible'
  return `A ${postulacion.tecnico_distancia_km.toFixed(2)} km de tu ubicación`
}

function coberturaTexto(postulacion: PostulacionSolicitud) {
  const radio = postulacion.tecnico_radio_cobertura_km
  if (postulacion.tecnico_cubre_zona == null) {
    return radio != null ? `Cobertura: ${radio} km` : 'Cobertura no indicada'
  }
  const estado = postulacion.tecnico_cubre_zona ? 'Dentro' : 'Fuera'
  return `${estado} de su cobertura${radio != null ? ` (${radio} km)` : ''}`
}

function coberturaSeveridad(postulacion: PostulacionSolicitud) {
  if (postulacion.tecnico_cubre_zona == null) return 'secondary'
  return postulacion.tecnico_cubre_zona ? 'success' : 'warn'
}

function verPerfil(tecnicoId: string) {
  perfilTecnicoId.value = tecnicoId
  perfilVisible.value = true
}

async function aceptarPostulacion(postulacion: PostulacionSolicitud) {
  if (!solicitud.value) return
  accionPostulacionId.value = postulacion.id
  accionPostulacionTipo.value = 'aceptar'
  try {
    solicitud.value = await solicitudesApi.aceptarPostulacion(
      solicitud.value.id,
      postulacion.id,
    )
    postulaciones.value = []
    toast.add({
      severity: 'success',
      summary: 'Técnico elegido',
      detail: 'La postulación fue aceptada.',
      life: 3000,
    })
    await cargarPerfilTecnico()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err instanceof Error ? err.message : 'No se pudo aceptar la postulación',
      life: 4000,
    })
  } finally {
    accionPostulacionId.value = null
    accionPostulacionTipo.value = null
  }
}

async function rechazarPostulacion(postulacion: PostulacionSolicitud) {
  if (!solicitud.value) return
  accionPostulacionId.value = postulacion.id
  accionPostulacionTipo.value = 'rechazar'
  try {
    await solicitudesApi.rechazarPostulacion(solicitud.value.id, postulacion.id)
    postulaciones.value = postulaciones.value.map((item) =>
      item.id === postulacion.id ? { ...item, estado: 'rechazada' as const } : item,
    )
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err instanceof Error ? err.message : 'No se pudo rechazar la postulación',
      life: 4000,
    })
  } finally {
    accionPostulacionId.value = null
    accionPostulacionTipo.value = null
  }
}

async function cancelarSolicitud() {
  if (!solicitud.value) return
  procesando.value = true
  try {
    await solicitudesApi.cancelar(solicitud.value.id)
    cancelarVisible.value = false
    toast.add({ severity: 'success', summary: 'Solicitud cancelada', life: 3000 })
    await cargarTodo()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err instanceof Error ? err.message : 'No se pudo cancelar la solicitud',
      life: 4000,
    })
  } finally {
    procesando.value = false
  }
}

async function rechazarOferta() {
  if (!solicitud.value) return
  if (motivoRechazo.value.trim().length < 5) {
    toast.add({
      severity: 'warn',
      summary: 'Falta el motivo',
      detail: 'Indica al cliente el motivo del rechazo (mínimo 5 caracteres).',
      life: 3000,
    })
    return
  }
  procesando.value = true
  try {
    await solicitudesApi.rechazar(solicitud.value.id, motivoRechazo.value.trim())
    rechazarVisible.value = false
    motivoRechazo.value = ''
    toast.add({ severity: 'success', summary: 'Solicitud rechazada', life: 3000 })
    await cargarTodo()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err instanceof Error ? err.message : 'No se pudo rechazar la solicitud',
      life: 4000,
    })
  } finally {
    procesando.value = false
  }
}

async function onCalificada() {
  await cargarTodo()
}

async function onCompletado() {
  completarVisible.value = false
  await cargarTodo()
}

function onPostulacionEnviada() {
  postulado.value = true
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Toast />

      <Button
        label="Volver"
        icon="pi pi-arrow-left"
        severity="secondary"
        variant="text"
        class="mb-4"
        @click="volver"
      />

      <div v-if="cargando" class="flex flex-col gap-4">
        <Skeleton width="16rem" height="2rem" />
        <Skeleton width="100%" height="8rem" />
        <Skeleton width="100%" height="14rem" />
      </div>

      <div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        <p><i class="pi pi-exclamation-triangle mr-1" />{{ error }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" @click="cargarTodo" />
      </div>

      <div v-else-if="solicitud" class="flex flex-col gap-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">Solicitud de servicio</p>
            <h1 class="mt-1 text-2xl font-semibold text-ink">{{ solicitud.descripcion }}</h1>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <Tag :value="estadoLabel(solicitud.estado)" :severity="estadoSeveridad(solicitud.estado)" />
              <span class="text-xs text-muted">
                <i class="pi pi-calendar mr-1" />Creada el {{ fechaHora(solicitud.fecha_solicitud) }}
              </span>
            </div>
          </div>
          <Button
            v-if="puedeCalificar"
            label="Calificar servicio"
            icon="pi pi-star"
            @click="calificarVisible = true"
          />
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <div class="flex flex-col gap-6 lg:col-span-2">
            <div class="rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-wide text-muted">
                    {{ esTecnico ? 'Cliente' : 'Técnico' }}
                  </p>
                  <p class="mt-1 font-semibold text-ink">
                    <template v-if="esTecnico">
                      {{ solicitud.cliente.nombres }} {{ solicitud.cliente.apellidos }}
                    </template>
                    <template v-else-if="solicitud.tecnico">
                      {{ solicitud.tecnico.nombres }} {{ solicitud.tecnico.apellidos }}
                    </template>
                    <template v-else>Técnico por asignar</template>
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button
                    v-if="solicitud.tecnico"
                    label="Ver perfil"
                    icon="pi pi-user"
                    size="small"
                    severity="secondary"
                    variant="outlined"
                    @click="verPerfil(solicitud.tecnico.id)"
                  />
                  <Button
                    v-if="puedePostular"
                    label="Postular a este trabajo"
                    icon="pi pi-send"
                    size="small"
                    @click="postularVisible = true"
                  />
                  <Button
                    v-else-if="esTecnico && solicitud.estado === 'pendiente' && !solicitud.tecnico"
                    label="Ya postulaste"
                    icon="pi pi-clock"
                    size="small"
                    severity="secondary"
                    variant="outlined"
                    disabled
                  />
                </div>
              </div>

              <div v-if="solicitud.categorias?.length" class="mt-4 flex flex-wrap gap-1.5">
                <div
                  v-for="categoria in solicitud.categorias"
                  :key="categoria.id"
                  class="flex w-full flex-wrap items-center gap-1.5"
                >
                  <Tag :value="categoria.nombre" severity="info" />
                  <template v-if="solicitud.tipos_servicio_por_categoria?.[categoria.id]?.length">
                    <Tag
                      v-for="tipo in tiposUnicosCategoria(categoria.id)"
                      :key="tipo"
                      :value="tipo"
                      severity="secondary"
                    />
                  </template>
                  <template v-else-if="solicitud.tipos_servicio?.length">
                    <Tag
                      v-for="tipo in solicitud.tipos_servicio"
                      :key="`fallback-${tipo}`"
                      :value="tipo"
                      severity="secondary"
                    />
                  </template>
                </div>
              </div>

              <p class="mt-4 text-sm text-ink whitespace-pre-line">{{ solicitud.descripcion }}</p>

              <div class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div class="rounded-lg bg-pacific/5 p-3">
                  <p class="text-xs text-muted">Dirección del servicio</p>
                  <p class="mt-1 text-ink">
                    <i class="pi pi-map-marker mr-1" />{{ solicitud.direccion || 'No indicada' }}
                  </p>
                  <a
                    v-if="solicitud.direccion"
                    :href="urlOpenStreetMap({
                      direccion: solicitud.direccion,
                      latitud: solicitud.direccion_latitud,
                      longitud: solicitud.direccion_longitud,
                    })"
                    target="_blank"
                    rel="noopener"
                    class="mt-1 inline-block text-xs text-pacific"
                  >
                    Abrir en OpenStreetMap
                  </a>
                </div>
                <div class="rounded-lg bg-pacific/5 p-3">
                  <p class="text-xs text-muted">
                    {{ solicitud.fecha_propuesta ? 'Horario propuesto' : 'Horario' }}
                  </p>
                  <p class="mt-1 text-ink">
                    <i class="pi pi-clock mr-1" />
                    {{
                      formatearPropuestaLlegada(solicitud.fecha_propuesta, solicitud.hora_propuesta) ??
                      'Sin horario indicado'
                    }}
                  </p>
                  <p v-if="solicitud.hora_fin_estimada" class="mt-1 text-xs text-muted">
                    Finalización estimada: {{ solicitud.hora_fin_estimada.slice(0, 5) }}
                  </p>
                </div>
              </div>

              <div
                v-if="solicitud.estado === 'pendiente' && solicitud.fecha_expiracion_oferta"
                class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700"
              >
                <i class="pi pi-hourglass mr-1" />
                La oferta deja de recibir propuestas el
                {{ fechaHora(solicitud.fecha_expiracion_oferta) }}.
              </div>

              <div
                v-if="solicitud.estado === 'rechazada'"
                class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600"
              >
                <i class="pi pi-times-circle mr-1" />
                La solicitud fue rechazada.
                <span v-if="solicitud.motivo_rechazo">{{ solicitud.motivo_rechazo }}</span>
              </div>
              <div
                v-else-if="solicitud.estado === 'cancelada'"
                class="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-600"
              >
                <i class="pi pi-ban mr-1" />La solicitud fue cancelada.
              </div>
              <div
                v-else-if="solicitud.estado === 'expirada'"
                class="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-600"
              >
                <i class="pi pi-hourglass mr-1" />La oferta expiró sin un técnico asignado.
              </div>
            </div>

            <div class="rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm">
              <h2 class="text-lg font-semibold text-ink">Historial de la solicitud</h2>
              <p class="mt-1 text-sm text-muted">
                Desde que se publicó la oferta hasta la finalización del servicio.
              </p>
              <Timeline :value="eventos" class="mt-5">
                <template #opposite="{ item }">
                  <p class="pr-2 text-xs text-muted">{{ item.fechaTexto }}</p>
                </template>
                <template #marker="{ item }">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-pacific text-white"
                  >
                    <i :class="item.icon" class="text-xs" />
                  </div>
                </template>
                <template #content="{ item }">
                  <div class="rounded-lg border border-pacific/10 bg-cloud/60 p-3">
                    <p class="font-medium text-ink">{{ item.titulo }}</p>
                    <p v-if="item.descripcion" class="mt-1 text-xs text-muted">
                      {{ item.descripcion }}
                    </p>
                  </div>
                </template>
              </Timeline>
            </div>

            <div
              v-if="esMiSolicitud && solicitud.estado === 'pendiente'"
              class="rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 class="text-lg font-semibold text-ink">Postulaciones recibidas</h2>
                  <p class="mt-1 text-sm text-muted">
                    Revisa la distancia y la cobertura de cada técnico antes de elegir.
                  </p>
                </div>
                <Tag :value="String(postulaciones.length)" severity="info" />
              </div>

              <div v-if="cargandoPostulaciones" class="mt-4 flex flex-col gap-3">
                <Skeleton width="100%" height="7rem" />
                <Skeleton width="100%" height="7rem" />
              </div>

              <p v-else-if="postulaciones.length === 0" class="mt-4 rounded-lg bg-cloud p-4 text-sm text-muted">
                <i class="pi pi-users mr-1" />Aún no hay técnicos postulados.
              </p>

              <div v-else class="mt-4 flex flex-col gap-3">
                <div
                  v-for="postulacion in postulaciones"
                  :key="postulacion.id"
                  class="rounded-xl border border-pacific/10 bg-cloud/40 p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="font-semibold text-ink">
                        {{ postulacion.tecnico_nombres }} {{ postulacion.tecnico_apellidos }}
                        <Tag
                          v-if="postulacion.tecnico_verificado"
                          value="Verificado"
                          severity="success"
                          class="ml-1"
                        />
                      </p>
                      <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>
                          <i class="pi pi-star-fill mr-1 text-coral" />
                          {{ Number(postulacion.tecnico_calificacion).toFixed(1) }}
                        </span>
                        <span>· {{ postulacion.tecnico_servicios_completados }} servicios completados</span>
                      </div>
                      <p class="mt-1 text-xs text-muted">
                        <i class="pi pi-map-marker mr-1" />{{ distanciaTexto(postulacion) }}
                      </p>
                      <Tag
                        :value="coberturaTexto(postulacion)"
                        :severity="coberturaSeveridad(postulacion)"
                        class="mt-2"
                      />
                    </div>
                    <p class="font-bold text-pacific">
                      {{ moneda(postulacion.precio) }}
                      <span class="text-xs font-normal text-muted">
                        {{
                          postulacion.unidad_cobro === 'por_hora'
                            ? '/ hora'
                            : postulacion.unidad_cobro === 'por_servicio'
                              ? '/ servicio'
                              : '/ visita'
                        }}
                      </span>
                    </p>
                  </div>
                  <p class="mt-1 text-xs text-muted">
                    {{ postulacion.tipo_servicio }} ·
                    {{ postulacion.negociable ? 'Precio negociable' : 'Precio no negociable' }}
                  </p>
                  <p v-if="postulacion.mensaje" class="mt-3 rounded-lg bg-card p-2 text-xs text-muted">
                    {{ postulacion.mensaje }}
                  </p>
                  <div class="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      label="Ver perfil"
                      icon="pi pi-user"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      @click="verPerfil(postulacion.tecnico_id)"
                    />
                    <Button
                      v-if="postulacion.estado === 'pendiente'"
                      label="Rechazar"
                      size="small"
                      severity="secondary"
                      variant="outlined"
                      :loading="accionPostulacionId === postulacion.id && accionPostulacionTipo === 'rechazar'"
                      :disabled="accionPostulacionId !== null"
                      @click="rechazarPostulacion(postulacion)"
                    />
                    <Button
                      v-if="postulacion.estado === 'pendiente'"
                      label="Elegir técnico"
                      icon="pi pi-check"
                      size="small"
                      :loading="accionPostulacionId === postulacion.id && accionPostulacionTipo === 'aceptar'"
                      :disabled="accionPostulacionId !== null"
                      @click="aceptarPostulacion(postulacion)"
                    />
                    <Tag v-else value="Rechazada" severity="secondary" />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!esTecnico && solicitud.tecnico"
              class="rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 class="text-lg font-semibold text-ink">Tu técnico</h2>
                  <p class="mt-1 text-sm text-muted">
                    Perfil y reseñas del técnico asignado a este servicio.
                  </p>
                </div>
                <Button
                  label="Ver perfil completo"
                  icon="pi pi-user"
                  severity="secondary"
                  variant="outlined"
                  size="small"
                  @click="verPerfil(solicitud.tecnico.id)"
                />
              </div>

              <div v-if="cargandoPerfil" class="mt-4 flex flex-col gap-2">
                <Skeleton width="14rem" height="1.4rem" />
                <Skeleton width="100%" height="9rem" />
              </div>

              <p v-else-if="errorPerfil" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <i class="pi pi-exclamation-triangle mr-1" />{{ errorPerfil }}
              </p>

              <template v-else-if="perfilTecnico">
                <div class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div class="rounded-lg bg-pacific/5 p-3">
                    <p class="text-xs text-muted">Calificación</p>
                    <div class="mt-1 flex items-center gap-2">
                      <Rating
                        :modelValue="Math.round(perfilTecnico.perfil.calificacion_promedio)"
                        readonly
                        :cancel="false"
                      />
                      <span class="text-xs font-medium text-ink">
                        {{ Number(perfilTecnico.perfil.calificacion_promedio).toFixed(1) }}
                      </span>
                    </div>
                  </div>
                  <div class="rounded-lg bg-pacific/5 p-3">
                    <p class="text-xs text-muted">Servicios completados</p>
                    <p class="mt-1 font-semibold text-ink">
                      {{ perfilTecnico.perfil.total_servicios_completados }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-pacific/5 p-3">
                    <p class="text-xs text-muted">Cobertura</p>
                    <p class="mt-1 font-semibold text-ink">
                      {{ perfilTecnico.perfil.radio_cobertura_km != null
                        ? `${perfilTecnico.perfil.radio_cobertura_km} km`
                        : 'No indicada' }}
                    </p>
                  </div>
                </div>

                <div class="mt-5">
                  <p class="font-semibold text-ink">
                    Reseñas
                    <span class="text-xs font-normal text-muted">
                      ({{ perfilTecnico.total_calificaciones }})
                    </span>
                  </p>
                  <ResenasCarousel
                    v-if="perfilTecnico.calificaciones.length"
                    :calificaciones="perfilTecnico.calificaciones"
                    class="mt-2"
                  />
                  <p v-else class="mt-2 rounded-lg bg-cloud p-3 text-sm text-muted">
                    Este técnico aún no tiene reseñas.
                  </p>
                </div>
              </template>
            </div>
          </div>

          <aside class="flex flex-col gap-6">
            <div class="rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm">
              <h2 class="text-sm font-semibold text-ink">Acciones disponibles</h2>
              <div class="mt-3 flex flex-col gap-2">
                <template v-if="esMiSolicitud">
                  <Button
                    v-if="puedeCancelar"
                    label="Cancelar solicitud"
                    icon="pi pi-times"
                    severity="warn"
                    variant="outlined"
                    @click="cancelarVisible = true"
                  />
                  <Button
                    v-if="puedeCalificar"
                    label="Calificar servicio"
                    icon="pi pi-star"
                    @click="calificarVisible = true"
                  />
                  <p
                    v-if="solicitud.estado === 'pendiente'"
                    class="rounded-lg bg-cloud p-3 text-xs text-muted"
                  >
                    <i class="pi pi-users mr-1" />
                    Esperando propuestas de técnicos.
                  </p>
                  <p
                    v-else-if="solicitud.estado === 'completada' && solicitud.calificacion"
                    class="rounded-lg bg-cloud p-3 text-xs text-muted"
                  >
                    <i class="pi pi-check-circle mr-1" />Servicio finalizado y calificado.
                  </p>
                </template>

                <template v-if="esTecnico">
                  <Button
                    v-if="puedePostular"
                    label="Postular a este trabajo"
                    icon="pi pi-send"
                    @click="postularVisible = true"
                  />
                  <Button
                    v-else-if="solicitud.estado === 'pendiente' && !solicitud.tecnico"
                    label="Ya postulaste"
                    icon="pi pi-clock"
                    severity="secondary"
                    variant="outlined"
                    disabled
                  />
                  <Button
                    v-if="puedeCompletar"
                    label="Marcar como completada"
                    icon="pi pi-flag"
                    @click="completarVisible = true"
                  />
                  <Button
                    v-if="puedeRechazarOferta"
                    label="Rechazar oferta"
                    icon="pi pi-times"
                    severity="warn"
                    variant="outlined"
                    @click="rechazarVisible = true"
                  />
                  <p
                    v-if="solicitud.estado === 'pendiente' && solicitud.tecnico"
                    class="rounded-lg bg-cloud p-3 text-xs text-muted"
                  >
                    <i class="pi pi-clock mr-1" />El cliente te asignó este trabajo.
                  </p>
                  <p
                    v-else-if="solicitud.estado === 'aceptada'"
                    class="rounded-lg bg-cloud p-3 text-xs text-muted"
                  >
                    <i class="pi pi-check-circle mr-1" />Servicio aceptado, pendiente de completar.
                  </p>
                </template>

                <p v-if="esAdmin" class="rounded-lg bg-cloud p-3 text-xs text-muted">
                  <i class="pi pi-shield mr-1" />Vista de administrador, sin acciones disponibles.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-pacific/10 bg-card p-5 text-sm shadow-sm">
              <h2 class="text-sm font-semibold text-ink">Resumen</h2>
              <dl class="mt-3 flex flex-col gap-2">
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Estado</dt>
                  <dd>
                    <Tag
                      :value="estadoLabel(solicitud.estado)"
                      :severity="estadoSeveridad(solicitud.estado)"
                    />
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Cliente</dt>
                  <dd class="text-right text-ink">
                    {{ solicitud.cliente.nombres }} {{ solicitud.cliente.apellidos }}
                  </dd>
                </div>
                <div v-if="solicitud.tecnico" class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Técnico</dt>
                  <dd class="text-right text-ink">
                    {{ solicitud.tecnico.nombres }} {{ solicitud.tecnico.apellidos }}
                  </dd>
                </div>
                <div v-if="solicitud.duracion_oferta_minutos" class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Publicación</dt>
                  <dd class="text-right text-ink">{{ solicitud.duracion_oferta_minutos }} minutos</dd>
                </div>
                <div v-if="solicitud.fecha_aceptacion" class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Aceptada</dt>
                  <dd class="text-right text-ink">{{ fechaHora(solicitud.fecha_aceptacion) }}</dd>
                </div>
                <div v-if="solicitud.fecha_completada" class="flex items-start justify-between gap-3">
                  <dt class="text-muted">Completada</dt>
                  <dd class="text-right text-ink">{{ fechaHora(solicitud.fecha_completada) }}</dd>
                </div>
              </dl>
            </div>

            <div
              v-if="solicitud.calificacion"
              class="rounded-2xl border border-pacific/10 bg-card p-5 text-sm shadow-sm"
            >
              <h2 class="text-sm font-semibold text-ink">Calificación del servicio</h2>
              <p
                v-if="solicitud.calificacion.tipo_servicio"
                class="mt-1 text-xs text-muted"
              >
                {{
                  solicitud?.categorias?.find((categoria) =>
                    categoria.id === solicitud?.calificacion?.categoria_id
                  )?.nombre
                }}
                <span v-if="solicitud.calificacion.tipo_servicio">
                  · {{ solicitud.calificacion.tipo_servicio }}
                </span>
              </p>
              <Rating
                :modelValue="solicitud.calificacion.calificacion"
                readonly
                :cancel="false"
                class="mt-2"
              />
              <p v-if="solicitud.calificacion.comentario" class="mt-2 whitespace-pre-line text-ink">
                {{ solicitud.calificacion.comentario }}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <PostularDialog
        v-model:visible="postularVisible"
        :solicitud="solicitud"
        @enviada="onPostulacionEnviada"
      />

      <CalificarServicioDialog
        :visible="calificarVisible"
        :solicitud="solicitud"
        @close="calificarVisible = false"
        @calificada="onCalificada"
      />

      <ConfirmarCompletacionDialog
        :visible="completarVisible"
        :solicitud-id="solicitud?.id ?? ''"
        @close="completarVisible = false"
        @confirmado="onCompletado"
      />

      <Dialog v-model:visible="cancelarVisible" header="Cancelar solicitud" modal class="w-full max-w-sm">
        <p class="text-sm text-ink">
          ¿Seguro que deseas cancelar esta solicitud? La cancelación no se puede deshacer.
        </p>
        <template #footer>
          <Button label="No, mantenerla" severity="secondary" @click="cancelarVisible = false" />
          <Button
            label="Sí, cancelar"
            icon="pi pi-times"
            severity="danger"
            :loading="procesando"
            @click="cancelarSolicitud"
          />
        </template>
      </Dialog>

      <Dialog v-model:visible="rechazarVisible" header="Rechazar oferta" modal class="w-full max-w-sm">
        <div class="flex flex-col gap-2">
          <p class="text-sm text-ink">
            Indica al cliente el motivo por el que no puedes atender esta solicitud.
          </p>
          <label for="motivo-rechazo" class="text-sm font-medium text-ink">Motivo del rechazo *</label>
          <Textarea
            id="motivo-rechazo"
            v-model="motivoRechazo"
            rows="3"
            auto-resize
            placeholder="Ej.: No atiendo esa zona, la reparación supera mis especialidades."
          />
        </div>
        <template #footer>
          <Button label="Cancelar" severity="secondary" @click="rechazarVisible = false" />
          <Button
            label="Rechazar"
            icon="pi pi-times"
            severity="warn"
            :loading="procesando"
            @click="rechazarOferta"
          />
        </template>
      </Dialog>

      <PerfilTecnicoPublicoDialog v-model:visible="perfilVisible" :tecnico-id="perfilTecnicoId" />
    </section>
  </div>
</template>
