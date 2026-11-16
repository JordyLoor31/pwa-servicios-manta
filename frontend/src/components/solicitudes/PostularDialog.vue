<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useAuthz } from '../../composables/auth/useAuthz'
import { solicitudesApi } from '../../services/solicitudes'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import type { Solicitud } from '../../types/solicitudes'
import type { TarifaTecnico, UnidadCobro } from '../../types/perfil-tecnico'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  solicitud: Solicitud | null
}>()

const emit = defineEmits<{
  enviada: []
}>()

const toast = useToast()
const { usuario } = useAuthz()
const oferta = ref<Solicitud | null>(null)
const mensaje = ref('')
const enviando = ref(false)
const cargandoTarifas = ref(true)
const tarifasPorCategoria = ref(new Map<string, TarifaTecnico>())

const tarifaAplicable = computed(() => {
  const solicitud = oferta.value
  if (!solicitud?.categorias?.length) return null
  const categorias = [...solicitud.categorias].sort((a, b) => a.nombre.localeCompare(b.nombre))
  for (const categoria of categorias) {
    const tarifa = tarifasPorCategoria.value.get(categoria.id)
    if (tarifa) return { tarifa, categoriaNombre: categoria.nombre }
  }
  return null
})

watch(
  () => [visible.value, props.solicitud] as const,
  ([abierto, solicitud]) => {
    if (!abierto || !solicitud) return
    oferta.value = solicitud
    mensaje.value = ''
    void preparar(solicitud)
  },
)

async function preparar(solicitud: Solicitud) {
  cargandoTarifas.value = true
  try {
    await Promise.all([cargarTarifas(), completarCategorias(solicitud)])
  } finally {
    cargandoTarifas.value = false
  }
}

async function cargarTarifas() {
  const usuarioId = usuario.value?.id
  if (!usuarioId) {
    tarifasPorCategoria.value = new Map()
    return
  }
  try {
    const tarifas = await perfilTecnicoApi.obtenerTarifas(usuarioId)
    tarifasPorCategoria.value = new Map(tarifas.map((tarifa) => [tarifa.categoria_id, tarifa]))
  } catch {
    tarifasPorCategoria.value = new Map()
  }
}

async function completarCategorias(solicitud: Solicitud) {
  if (solicitud.categorias?.length) return
  try {
    oferta.value = await solicitudesApi.obtener(solicitud.id)
  } catch {
    // se conserva la solicitud recibida
  }
}

function moneda(valor: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor)
}

function unidadTexto(unidad: UnidadCobro) {
  return unidad === 'por_hora' ? '/ hora' : '/ servicio'
}

async function enviar() {
  if (!oferta.value) return
  if (!tarifaAplicable.value) {
    toast.add({
      severity: 'warn',
      summary: 'Falta tu tarifa',
      detail: 'Configura una tarifa para las categorías de esta oferta en tu perfil.',
      life: 4000,
    })
    return
  }
  enviando.value = true
  try {
    await solicitudesApi.postular(oferta.value.id, {
      mensaje: mensaje.value.trim() || undefined,
    })
    visible.value = false
    toast.add({
      severity: 'success',
      summary: 'Propuesta enviada',
      detail: 'El cliente podrá revisarla en tiempo real.',
      life: 4000,
    })
    emit('enviada')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo enviar la propuesta',
      life: 4000,
    })
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Enviar propuesta" modal class="w-full max-w-md">
    <div v-if="oferta" class="flex flex-col gap-4">
      <p class="text-sm text-muted">{{ oferta.descripcion }}</p>
      <div v-if="cargandoTarifas" class="rounded-lg border border-pacific/10 bg-card p-3">
        <Skeleton width="8rem" height="0.9rem" />
        <Skeleton width="12rem" height="1.4rem" class="mt-2" />
      </div>
      <div v-else-if="tarifaAplicable" class="rounded-lg border border-pacific/10 bg-pacific/5 p-3">
        <p class="text-xs text-muted">
          Tarifa de tu perfil · {{ tarifaAplicable.categoriaNombre }}
        </p>
        <p class="mt-1 text-lg font-semibold text-ink">
          {{ moneda(tarifaAplicable.tarifa.precio_min) }} - {{ moneda(tarifaAplicable.tarifa.precio_max) }}
          <span class="text-xs font-normal text-muted">
            {{ unidadTexto(tarifaAplicable.tarifa.unidad_cobro) }}
          </span>
        </p>
        <p class="mt-1 text-xs text-muted">
          Se enviará tu precio base de {{ moneda(tarifaAplicable.tarifa.precio_min) }}
          {{ unidadTexto(tarifaAplicable.tarifa.unidad_cobro) }}.
        </p>
      </div>
      <div v-else class="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
        <i class="pi pi-exclamation-triangle mr-1" />
        No tienes una tarifa configurada para las categorías de esta oferta.
        <RouterLink to="/perfil" class="font-medium underline">Actualizar mi perfil</RouterLink>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="mensaje-propuesta" class="text-sm font-medium text-ink">Mensaje (opcional)</label>
        <Textarea id="mensaje-propuesta" v-model="mensaje" rows="3" auto-resize class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="visible = false" />
      <Button
        label="Enviar propuesta"
        icon="pi pi-send"
        :loading="enviando"
        :disabled="cargandoTarifas || !tarifaAplicable"
        @click="enviar"
      />
    </template>
  </Dialog>
</template>
