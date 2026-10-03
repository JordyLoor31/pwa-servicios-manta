<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AppHeader from '../../components/layout/AppHeader.vue'
import NuevaSolicitudDialog from '../../components/solicitudes/NuevaSolicitudDialog.vue'
import DetalleSolicitudDialog from '../../components/solicitudes/DetalleSolicitudDialog.vue'
import { useSolicitudes } from '../../composables/solicitudes/useSolicitudes'
import type { EstadoSolicitud, Solicitud } from '../../types/solicitudes'
import {
  estadoSeveridad,
  estadoLabel,
  formatearPropuestaLlegada,
} from '../../utils/solicitudes'
import { api } from '../../services/api'

const {
  solicitudes,
  cargando,
  total,
  page,
  totalPaginas,
  filtroEstado,
  formAbierto,
  detalleVisible,
  solicitudActiva,
  cambiarFiltroEstado,
  abrirFormulario,
  cargar,
  irPagina,
  verDetalle,
  cerrarDetalle,
} = useSolicitudes()

const toast = useToast()

const FRECUENCIAS: { valor: 'todos' | EstadoSolicitud; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'pendiente', label: 'Pendiente' },
  { valor: 'aceptada', label: 'Aceptada' },
  { valor: 'completada', label: 'Completada' },
  { valor: 'rechazada', label: 'Rechazada' },
  { valor: 'cancelada', label: 'Cancelada' },
]

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` }))

async function onCreada(creada: Solicitud) {
  await cargar()
  verDetalle(creada)
}

async function cancelarSolicitud(solicitud: Solicitud) {
  try {
    await api.patch(`/solicitudes/${solicitud.id}/cancelar`, {})
    toast.add({ severity: 'success', summary: 'Solicitud cancelada', life: 3000 })
    cerrarDetalle()
    await cargar()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo cancelar la solicitud',
      life: 4000,
    })
  }
}

function onSolicitudActualizada() {
  cargar()
}

onMounted(() => {
  window.addEventListener('camello:solicitud-actualizada', onSolicitudActualizada)
})

onUnmounted(() => {
  window.removeEventListener('camello:solicitud-actualizada', onSolicitudActualizada)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Toast />

      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Mis solicitudes</h1>
          <p class="mt-1 text-sm text-muted">
            {{ total }} {{ total === 1 ? 'solicitud' : 'solicitudes' }} de servicio a técnicos.
          </p>
        </div>
        <Button label="Nueva solicitud" icon="pi pi-plus" @click="abrirFormulario" />
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="frecuencia in FRECUENCIAS"
          :key="frecuencia.label"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="
            filtroEstado === frecuencia.valor
              ? 'bg-pacific text-white'
              : 'border border-pacific/20 bg-card text-muted hover:text-pacific'
          "
          @click="cambiarFiltroEstado(frecuencia.valor)"
        >
          {{ frecuencia.label }}
        </button>
      </div>

      <div v-if="solicitudes.length === 0 && !cargando" class="py-16 text-center">
        <i class="pi pi-inbox text-5xl text-muted" />
        <p class="mt-4 text-sm text-muted">Aún no has solicitado ningún servicio.</p>
        <Button label="Solicitar mi primer servicio" icon="pi pi-plus" class="mt-4" @click="abrirFormulario" />
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="item in cargando ? placeholders : solicitudes"
          :key="item.id"
          class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm"
        >
          <template v-if="cargando">
            <div class="flex items-center justify-between">
              <Skeleton width="7rem" height="1.5rem" />
              <Skeleton width="5rem" height="1.25rem" />
            </div>
            <Skeleton width="100%" height="0.9rem" class="mt-3" />
            <Skeleton width="45%" height="0.8rem" class="mt-2" />
          </template>
          <template v-else>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <i class="pi pi-wrench text-pacific" />
                <span class="font-semibold text-ink">
                  {{ (item as Solicitud).tecnico?.nombres ?? 'Técnico' }} {{ (item as Solicitud).tecnico?.apellidos ?? 'por asignar' }}
                </span>
                <Tag
                  :value="estadoLabel((item as Solicitud).estado)"
                  :severity="estadoSeveridad((item as Solicitud).estado)"
                />
              </div>
              <Button
                label="Ver detalle"
                icon="pi pi-eye"
                severity="secondary"
                variant="outlined"
                size="small"
                @click="verDetalle(item as Solicitud)"
              />
            </div>
            <p class="mt-3 text-sm text-ink">{{ (item as Solicitud).descripcion }}</p>
            <p class="mt-1 text-sm text-muted">
              <i class="pi pi-map-marker mr-1" />{{ (item as Solicitud).direccion || 'Dirección no indicada' }}
            </p>
            <div class="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              <span>
                <i class="pi pi-calendar mr-1" />
                {{ new Date((item as Solicitud).fecha_solicitud).toLocaleString() }}
              </span>
              <span v-if="formatearPropuestaLlegada((item as Solicitud).fecha_propuesta, (item as Solicitud).hora_propuesta)">
                <i class="pi pi-clock mr-1" />
                Llegada propuesta:
                {{ formatearPropuestaLlegada((item as Solicitud).fecha_propuesta, (item as Solicitud).hora_propuesta) }}
              </span>
              <span v-if="(item as Solicitud).motivo_rechazo" class="text-red-500">
                <i class="pi pi-comment mr-1" />{{ (item as Solicitud).motivo_rechazo }}
              </span>
            </div>
          </template>
        </div>

        <div v-if="total > 0" class="mt-4 flex items-center justify-center gap-3">
          <Button
            icon="pi pi-chevron-left"
            severity="secondary"
            variant="outlined"
            :disabled="page <= 1"
            aria-label="Página anterior"
            @click="irPagina(page - 1)"
          />
          <span class="text-sm text-muted">Página {{ page }} de {{ totalPaginas }}</span>
          <Button
            icon="pi pi-chevron-right"
            severity="secondary"
            variant="outlined"
            :disabled="page >= totalPaginas"
            aria-label="Página siguiente"
            @click="irPagina(page + 1)"
          />
        </div>
      </div>

      <NuevaSolicitudDialog v-model:visible="formAbierto" @creada="onCreada" />
      <DetalleSolicitudDialog
        v-model:visible="detalleVisible"
        :solicitud="solicitudActiva"
        @cerrar="cerrarDetalle"
        @cancelar="cancelarSolicitud"
      />
    </section>
  </div>
</template>