<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useSolicitudes } from '../../composables/solicitudes/useSolicitudes'
import { limpiarNotificacionesNuevas } from '../../composables/notificaciones/useNotificaciones'
import type { Solicitud } from '../../types/solicitudes'
import { estadoSeveridad, estadoLabel, formatearPropuestaLlegada } from '../../utils/solicitudes'

const toast = useToast()

const {
  solicitudes,
  cargando,
  total,
  page,
  totalPaginas,
  detalleVisible,
  solicitudActiva,
  confirmarAccionVisible,
  accionPendiente,
  motivoRechazo,
  fechaAceptacion,
  horaAceptacion,
  duracionHorasAceptacion,
  verDetalle,
  cerrarDetalle,
  confirmarAceptar,
  confirmarCompletar,
  confirmarRechazar,
  ejecutarAccion,
  cerrarConfirmacion,
  cargar,
  irPagina,
} = useSolicitudes()

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` }))

interface EventoSolicitud {
  evento?: 'solicitud.nueva' | 'solicitud.actualizada'
  solicitud?: {
    cliente?: { nombres?: string; apellidos?: string }
  }
}

function onSolicitudNueva(event: Event) {
  const payload = (event as CustomEvent<EventoSolicitud>).detail
  const cliente = payload?.solicitud?.cliente
  toast.add({
    severity: 'success',
    summary: 'Nueva solicitud',
    detail: `${cliente?.nombres ?? 'Un cliente'} quiere un servicio. Ábrela para responder.`,
    life: 6000,
  })
  cargar()
}

function onSolicitudActualizada() {
  cargar()
}

onMounted(() => {
  limpiarNotificacionesNuevas()
  window.addEventListener('camello:solicitud-nueva', onSolicitudNueva)
  window.addEventListener('camello:solicitud-actualizada', onSolicitudActualizada)
})

onUnmounted(() => {
  window.removeEventListener('camello:solicitud-nueva', onSolicitudNueva)
  window.removeEventListener('camello:solicitud-actualizada', onSolicitudActualizada)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Toast />

      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ink">Solicitudes recibidas</h1>
        <p class="mt-1 text-sm text-muted">
          Tienes {{ total }} {{ total === 1 ? 'solicitud' : 'solicitudes' }} de clientes en Manta.
        </p>
      </div>

      <div v-if="solicitudes.length === 0 && !cargando" class="py-16 text-center">
        <i class="pi pi-inbox text-5xl text-muted" />
        <p class="mt-4 text-sm text-muted">Aún no has recibido solicitudes de servicios.</p>
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
                <i class="pi pi-user text-pacific" />
                <span class="font-semibold text-ink">
                  {{ (item as Solicitud).cliente.nombres }} {{ (item as Solicitud).cliente.apellidos }}
                </span>
                <Tag
                  :value="estadoLabel((item as Solicitud).estado)"
                  :severity="estadoSeveridad((item as Solicitud).estado)"
                />
              </div>
              <div class="flex gap-2">
                <Button
                  v-if="(item as Solicitud).estado === 'pendiente'"
                  label="Aceptar"
                  icon="pi pi-check"
                  size="small"
                  @click="confirmarAceptar(item as Solicitud)"
                />
                <Button
                  v-if="(item as Solicitud).estado === 'aceptada'"
                  label="Completar"
                  icon="pi pi-flag"
                  size="small"
                  @click="confirmarCompletar(item as Solicitud)"
                />
                <Button
                  v-if="(item as Solicitud).estado === 'pendiente'"
                  label="Rechazar"
                  icon="pi pi-times"
                  severity="warn"
                  variant="outlined"
                  size="small"
                  @click="confirmarRechazar(item as Solicitud)"
                />
                <Button
                  label="Ver detalle"
                  icon="pi pi-eye"
                  severity="secondary"
                  variant="outlined"
                  size="small"
                  @click="verDetalle(item as Solicitud)"
                />
              </div>
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
              <span
                v-if="formatearPropuestaLlegada((item as Solicitud).fecha_propuesta, (item as Solicitud).hora_propuesta)"
                class="font-medium text-pacific"
              >
                <i class="pi pi-clock mr-1" />
                Llegada propuesta:
                {{ formatearPropuestaLlegada((item as Solicitud).fecha_propuesta, (item as Solicitud).hora_propuesta) }}
              </span>
              <span v-if="(item as Solicitud).unidad_cobro" class="font-medium text-pacific">
                <i class="pi pi-tag mr-1" />
                {{ (item as Solicitud).unidad_cobro === 'por_hora' ? 'Cobro por hora' : 'Cobro por servicio' }}
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

      <Dialog v-model:visible="detalleVisible" header="Detalle de la solicitud" modal class="w-full max-w-lg">
        <div v-if="solicitudActiva" class="mt-2 flex flex-col gap-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-ink">
              {{ solicitudActiva.cliente.nombres }} {{ solicitudActiva.cliente.apellidos }}
            </span>
            <Tag
              :value="estadoLabel(solicitudActiva.estado)"
              :severity="estadoSeveridad(solicitudActiva.estado)"
            />
          </div>
          <p class="text-ink">{{ solicitudActiva.descripcion }}</p>
          <p class="text-muted">
            <i class="pi pi-map-marker mr-1" />{{ solicitudActiva.direccion || 'Dirección no indicada' }}
          </p>
          <div
            v-if="formatearPropuestaLlegada(solicitudActiva.fecha_propuesta, solicitudActiva.hora_propuesta)"
            class="rounded-lg bg-pacific/10 p-3 text-sm text-ink"
          >
            <p class="font-semibold">
              <i class="pi pi-clock mr-1" />Llegada propuesta:
              {{ formatearPropuestaLlegada(solicitudActiva.fecha_propuesta, solicitudActiva.hora_propuesta) }}
            </p>
            <p class="mt-1 text-xs text-muted">
              Es una hora tentativa: acuerda la hora exacta de llegada con el cliente.
            </p>
          </div>
          <p class="text-xs text-muted">
            <i class="pi pi-calendar mr-1" />
            Solicitada el {{ new Date(solicitudActiva.fecha_solicitud).toLocaleString() }}
          </p>
          <p v-if="solicitudActiva.fecha_aceptacion" class="text-xs text-muted">
            <i class="pi pi-check-circle mr-1" />
            Aceptada el {{ new Date(solicitudActiva.fecha_aceptacion).toLocaleString() }}
          </p>
          <p v-if="solicitudActiva.fecha_completada" class="text-xs text-muted">
            <i class="pi pi-flag mr-1" />
            Completada el {{ new Date(solicitudActiva.fecha_completada).toLocaleString() }}
          </p>
          <p v-if="solicitudActiva.motivo_rechazo" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <i class="pi pi-comment mr-1" />{{ solicitudActiva.motivo_rechazo }}
          </p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button
              v-if="solicitudActiva?.estado === 'pendiente'"
              label="Rechazar"
              icon="pi pi-times"
              severity="warn"
              variant="outlined"
              @click="confirmarRechazar(solicitudActiva)"
            />
            <Button
              v-if="solicitudActiva?.estado === 'pendiente'"
              label="Aceptar"
              icon="pi pi-check"
              @click="confirmarAceptar(solicitudActiva)"
            />
            <Button
              v-if="solicitudActiva?.estado === 'aceptada'"
              label="Marcar como completada"
              icon="pi pi-flag"
              @click="confirmarCompletar(solicitudActiva)"
            />
            <Button label="Cerrar" severity="secondary" @click="cerrarDetalle" />
          </div>
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmarAccionVisible"
        :header="accionPendiente === 'rechazar' ? 'Rechazar solicitud' : 'Confirmar acción'"
        modal
        class="w-full max-w-sm"
      >
        <div v-if="accionPendiente === 'aceptar'" class="flex flex-col gap-3">
          <p class="text-sm text-ink">
            ¿Confirmas que aceptas la solicitud de
            <span class="font-semibold">
              {{ solicitudActiva?.cliente.nombres }} {{ solicitudActiva?.cliente.apellidos }}
            </span>
            ?
          </p>
          <label class="text-sm font-medium text-ink">Fecha del servicio *</label>
          <input v-model="fechaAceptacion" type="date" class="rounded border p-2" />
          <label class="text-sm font-medium text-ink">Hora de inicio *</label>
          <input v-model="horaAceptacion" type="time" class="rounded border p-2" />
          <label class="text-sm font-medium text-ink">Duración (horas) *</label>
          <input v-model.number="duracionHorasAceptacion" type="number" min="1" max="12" class="rounded border p-2" />
        </div>
        <p v-else-if="accionPendiente === 'completar'" class="text-sm text-ink">
          ¿El servicio para
          <span class="font-semibold">
            {{ solicitudActiva?.cliente.nombres }} {{ solicitudActiva?.cliente.apellidos }}
          </span>
          ya se entregó? Al confirmar, sumará un servicio completado a tu perfil.
        </p>
        <div v-else class="flex flex-col gap-2">
          <label for="motivo" class="text-sm font-medium text-ink">Motivo del rechazo *</label>
          <Textarea
            id="motivo"
            v-model="motivoRechazo"
            rows="3"
            auto-resize
            placeholder="Ej.: No atiendo esa zona, la reparación supera mis especialidades."
          />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="cerrarConfirmacion" />
            <Button
              :label="accionPendiente === 'rechazar' ? 'Rechazar' : 'Confirmar'"
              :icon="accionPendiente === 'rechazar' ? 'pi pi-times' : 'pi pi-check'"
              :severity="accionPendiente === 'rechazar' ? 'warn' : 'primary'"
              @click="ejecutarAccion"
            />
          </div>
        </template>
      </Dialog>
    </section>
  </div>
</template>