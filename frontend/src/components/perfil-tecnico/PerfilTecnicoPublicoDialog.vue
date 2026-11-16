<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Rating from 'primevue/rating'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import type { PerfilPublico } from '../../types/perfil-tecnico'
import ResenasCarousel from './ResenasCarousel.vue'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  tecnicoId: string | null
}>()

const perfil = ref<PerfilPublico | null>(null)
const cargando = ref(false)
const error = ref('')

watch(
  () => [visible.value, props.tecnicoId] as const,
  ([abierto, tecnicoId]) => {
    if (!abierto || !tecnicoId) {
      if (!abierto) perfil.value = null
      return
    }
    void cargar(tecnicoId)
  },
)

async function cargar(tecnicoId: string) {
  cargando.value = true
  error.value = ''
  try {
    perfil.value = await perfilTecnicoApi.obtenerPerfilPublico(tecnicoId)
  } catch (err) {
    perfil.value = null
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el perfil del técnico'
  } finally {
    cargando.value = false
  }
}

function moneda(valor: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor)
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Perfil del técnico" modal class="w-full max-w-2xl">
    <div v-if="cargando" class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <Skeleton shape="circle" size="3.5rem" />
        <div class="flex-1">
          <Skeleton width="10rem" height="1.2rem" />
          <Skeleton width="6rem" height="0.9rem" class="mt-2" />
        </div>
      </div>
      <Skeleton width="100%" height="4rem" />
      <Skeleton width="100%" height="6rem" />
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
      <i class="pi pi-exclamation-triangle mr-1" />{{ error }}
    </div>

    <div v-else-if="perfil" class="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
      <div class="flex items-center gap-3">
        <img
          v-if="perfil.usuario.avatar_url"
          :src="perfil.usuario.avatar_url"
          :alt="`Foto de ${perfil.usuario.nombres}`"
          class="h-14 w-14 rounded-full object-cover"
        />
        <div
          v-else
          class="flex h-14 w-14 items-center justify-center rounded-full bg-pacific/10 text-xl font-semibold text-pacific"
        >
          {{ perfil.usuario.nombres.charAt(0) }}
        </div>
        <div>
          <p class="font-semibold text-ink">
            {{ perfil.usuario.nombres }} {{ perfil.usuario.apellidos }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <Tag v-if="perfil.perfil.verificado" value="Técnico verificado" severity="success" />
            <Tag
              :value="`${perfil.total_calificaciones} ${perfil.total_calificaciones === 1 ? 'reseña' : 'reseñas'}`"
              severity="info"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div class="rounded-lg bg-pacific/5 p-3">
          <p class="text-xs text-muted">Calificación</p>
          <div class="mt-1 flex items-center gap-1">
            <Rating
              :modelValue="Math.round(perfil.perfil.calificacion_promedio)"
              readonly
              :cancel="false"
            />
          </div>
          <p class="mt-1 text-xs font-medium text-ink">
            {{ Number(perfil.perfil.calificacion_promedio).toFixed(1) }} / 5
          </p>
        </div>
        <div class="rounded-lg bg-pacific/5 p-3">
          <p class="text-xs text-muted">Servicios completados</p>
          <p class="mt-1 font-semibold text-ink">{{ perfil.perfil.total_servicios_completados }}</p>
        </div>
        <div class="rounded-lg bg-pacific/5 p-3">
          <p class="text-xs text-muted">Experiencia</p>
          <p class="mt-1 font-semibold text-ink">
            {{ perfil.perfil.anios_experiencia != null ? `${perfil.perfil.anios_experiencia} años` : 'No indicada' }}
          </p>
        </div>
        <div class="rounded-lg bg-pacific/5 p-3">
          <p class="text-xs text-muted">Cobertura</p>
          <p class="mt-1 font-semibold text-ink">
            {{ perfil.perfil.radio_cobertura_km != null ? `${perfil.perfil.radio_cobertura_km} km` : 'No indicada' }}
          </p>
        </div>
      </div>

      <div>
        <p class="font-semibold text-ink">Sobre el técnico</p>
        <p v-if="perfil.perfil.biografia" class="mt-1 whitespace-pre-line text-ink">
          {{ perfil.perfil.biografia }}
        </p>
        <p v-else class="mt-1 text-muted">Este técnico aún no ha agregado una biografía.</p>
      </div>

      <div v-if="perfil.categorias.length">
        <p class="font-semibold text-ink">Especialidades</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <Tag
            v-for="categoria in perfil.categorias"
            :key="categoria.id"
            :value="categoria.nombre"
            severity="info"
          />
        </div>
      </div>

      <div v-if="perfil.tarifas.length">
        <p class="font-semibold text-ink">Tarifas de referencia</p>
        <div class="mt-2 flex flex-col gap-1.5">
          <div
            v-for="tarifa in perfil.tarifas"
            :key="tarifa.categoria_id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-pacific/10 bg-card px-3 py-2"
          >
            <span class="text-ink">{{ tarifa.categoria_nombre ?? 'Categoría' }}</span>
            <span class="font-medium text-pacific">
              {{ moneda(tarifa.precio_min) }} - {{ moneda(tarifa.precio_max) }}
              <span class="text-xs font-normal text-muted">
                {{ tarifa.unidad_cobro === 'por_hora' ? '/ hora' : '/ servicio' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="perfil.certificaciones.length">
        <p class="font-semibold text-ink">Certificaciones verificadas</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <Tag
            v-for="(certificacion, indice) in perfil.certificaciones"
            :key="`${certificacion.tipo_documento}-${indice}`"
            :value="certificacion.tipo_documento"
            icon="pi pi-verified"
            severity="success"
          />
        </div>
      </div>

      <div>
        <p class="font-semibold text-ink">
          Reseñas
          <span class="text-xs font-normal text-muted">({{ perfil.total_calificaciones }})</span>
        </p>
        <ResenasCarousel
          v-if="perfil.calificaciones.length"
          :calificaciones="perfil.calificaciones"
          :activo="visible"
          class="mt-2"
        />
        <p v-else class="mt-1 text-muted">Este técnico aún no tiene reseñas.</p>
      </div>
    </div>

    <template #footer>
      <Button label="Cerrar" severity="secondary" @click="visible = false" />
    </template>
  </Dialog>
</template>
