<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import type { Solicitud } from '../../types/solicitudes'
import { estadoSeveridad, estadoLabel, formatearPropuestaLlegada } from '../../utils/solicitudes'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{ solicitud: Solicitud | null }>()

const emit = defineEmits<{ cerrar: []; cancelar: [solicitud: Solicitud] }>()

const confirmando = ref(false)

function urlOpenStreetMap(direccion: string | null | undefined, latitud?: number | null, longitud?: number | null) {
  if (latitud != null && longitud != null) {
    return `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=16/${latitud}/${longitud}`
  }
  return direccion
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(direccion)}`
    : '#'
}

watch(visible, (abierto) => {
  if (!abierto) confirmando.value = false
})

function pedirCancelar() {
  if (props.solicitud) confirmando.value = true
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Detalle de la solicitud" modal class="w-full max-w-lg">
    <div v-if="solicitud" class="mt-2 flex flex-col gap-3 text-sm">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-ink">
          {{ solicitud.tecnico?.nombres ?? 'Técnico' }} {{ solicitud.tecnico?.apellidos ?? 'por asignar' }}
        </span>
        <Tag
          :value="estadoLabel(solicitud.estado)"
          :severity="estadoSeveridad(solicitud.estado)"
        />
      </div>
      <p class="text-ink">{{ solicitud.descripcion }}</p>
      <p class="text-muted">
        <i class="pi pi-map-marker mr-1" />{{ solicitud.direccion || 'Dirección no indicada' }}
        <a
          v-if="solicitud.direccion"
          :href="urlOpenStreetMap(solicitud.direccion, solicitud.direccion_latitud, solicitud.direccion_longitud)"
          target="_blank"
          rel="noopener"
          class="ml-2 text-pacific"
        >Abrir en OpenStreetMap</a>
      </p>
      <div
        v-if="formatearPropuestaLlegada(solicitud.fecha_propuesta, solicitud.hora_propuesta)"
        class="rounded-lg bg-pacific/10 p-3 text-sm text-ink"
      >
        <p class="font-semibold">
          <i class="pi pi-clock mr-1" />Llegada propuesta:
          {{ formatearPropuestaLlegada(solicitud.fecha_propuesta, solicitud.hora_propuesta) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Es una hora tentativa: el técnico acordará la hora exacta de llegada contigo.
        </p>
      </div>
      <p v-if="solicitud.unidad_cobro" class="text-xs text-muted">
        <i class="pi pi-tag mr-1" />
        {{ solicitud.unidad_cobro === 'por_hora' ? 'Cobra por hora' : 'Cobra por servicio' }}
      </p>
      <p class="text-xs text-muted">
        <i class="pi pi-calendar mr-1" />
        Solicitada el {{ new Date(solicitud.fecha_solicitud).toLocaleString() }}
      </p>
      <p v-if="solicitud.fecha_aceptacion" class="text-xs text-muted">
        <i class="pi pi-check-circle mr-1" />
        Aceptada el {{ new Date(solicitud.fecha_aceptacion).toLocaleString() }}
      </p>
      <p v-if="solicitud.fecha_completada" class="text-xs text-muted">
        <i class="pi pi-flag mr-1" />
        Completada el {{ new Date(solicitud.fecha_completada).toLocaleString() }}
      </p>
      <p v-if="solicitud.motivo_rechazo" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
        <i class="pi pi-comment mr-1" />{{ solicitud.motivo_rechazo }}
      </p>

      <div
        v-if="confirmando"
        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        ¿Seguro que deseas cancelar la solicitud a
        <span class="font-semibold">{{ solicitud.tecnico?.nombres ?? 'Técnico' }} {{ solicitud.tecnico?.apellidos ?? 'por asignar' }}</span
        >? La cancelación no se puede deshacer.
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <template v-if="solicitud && (solicitud.estado === 'pendiente' || solicitud.estado === 'aceptada')">
          <template v-if="confirmando">
            <Button label="No, mantenerla" severity="secondary" @click="confirmando = false" />
            <Button label="Sí, cancelar" icon="pi pi-times" severity="danger" @click="emit('cancelar', solicitud)" />
          </template>
          <Button
            v-else
            label="Cancelar solicitud"
            icon="pi pi-times"
            severity="warn"
            variant="outlined"
            @click="pedirCancelar"
          />
        </template>
        <Button label="Cerrar" severity="secondary" @click="emit('cerrar')" />
      </div>
    </template>
  </Dialog>
</template>