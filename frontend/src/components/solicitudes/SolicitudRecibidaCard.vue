<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { Solicitud } from '../../types/solicitudes'
import { estadoSeveridad, estadoLabel, formatearPropuestaLlegada } from '../../utils/solicitudes'
import { urlOpenStreetMap } from '../../utils/openStreetMap'

const props = defineProps<{ solicitud: Solicitud }>()

const emit = defineEmits<{
  postular: []
  completar: []
  rechazar: []
  verDetalle: []
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <i class="pi pi-user text-pacific" />
      <span class="font-semibold text-ink">
        {{ solicitud.cliente.nombres }} {{ solicitud.cliente.apellidos }}
      </span>
      <Tag :value="estadoLabel(solicitud.estado)" :severity="estadoSeveridad(solicitud.estado)" />
    </div>
    <div class="flex gap-2">
      <Button
        v-if="solicitud.estado === 'pendiente' && !solicitud.tecnico && !solicitud.postulado_por_mi"
        label="Postular a este trabajo"
        icon="pi pi-send"
        size="small"
        @click="emit('postular')"
      />
      <Button
        v-if="solicitud.estado === 'pendiente' && solicitud.postulado_por_mi"
        label="Ya postulaste"
        icon="pi pi-clock"
        severity="secondary"
        variant="outlined"
        size="small"
        disabled
      />
      <Button
        v-if="solicitud.estado === 'aceptada'"
        label="Completar"
        icon="pi pi-flag"
        size="small"
        @click="emit('completar')"
      />
      <Button
        v-if="solicitud.estado === 'pendiente'"
        label="Rechazar"
        icon="pi pi-times"
        severity="warn"
        variant="outlined"
        size="small"
        @click="emit('rechazar')"
      />
      <Button
        label="Ver detalle"
        icon="pi pi-eye"
        severity="secondary"
        variant="outlined"
        size="small"
        @click="emit('verDetalle')"
      />
    </div>
  </div>
  <p class="mt-3 text-sm text-ink">{{ solicitud.descripcion }}</p>
  <div v-if="solicitud.categorias?.length" class="mt-2 flex flex-wrap gap-1.5">
    <Tag
      v-for="categoria in solicitud.categorias"
      :key="categoria.id"
      :value="categoria.nombre"
      severity="info"
    />
  </div>
  <p class="mt-1 text-sm text-muted">
    <i class="pi pi-map-marker mr-1" />{{ solicitud.direccion || 'Dirección no indicada' }}
    <a
      v-if="solicitud.direccion"
      :href="urlOpenStreetMap({ direccion: solicitud.direccion, latitud: solicitud.direccion_latitud, longitud: solicitud.direccion_longitud })"
      target="_blank"
      rel="noopener"
      class="ml-2 text-pacific"
    >Abrir en OpenStreetMap</a>
  </p>
  <div class="mt-2 flex flex-wrap gap-3 text-xs text-muted">
    <span>
      <i class="pi pi-calendar mr-1" />
      {{ new Date(solicitud.fecha_solicitud).toLocaleString() }}
    </span>
    <span
      v-if="formatearPropuestaLlegada(solicitud.fecha_propuesta, solicitud.hora_propuesta)"
      class="font-medium text-pacific"
    >
      <i class="pi pi-clock mr-1" />
      Llegada propuesta:
      {{ formatearPropuestaLlegada(solicitud.fecha_propuesta, solicitud.hora_propuesta) }}
    </span>
    <span v-if="solicitud.unidad_cobro" class="font-medium text-pacific">
      <i class="pi pi-tag mr-1" />
      {{ solicitud.unidad_cobro === 'por_hora' ? 'Cobro por hora' : 'Cobro por servicio' }}
    </span>
    <span v-if="solicitud.motivo_rechazo" class="text-red-500">
      <i class="pi pi-comment mr-1" />{{ solicitud.motivo_rechazo }}
    </span>
  </div>
</template>
