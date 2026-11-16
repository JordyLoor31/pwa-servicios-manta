<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AppHeader from '../../components/layout/AppHeader.vue'
import SolicitudRecibidaCard from '../../components/solicitudes/SolicitudRecibidaCard.vue'
import ConfirmarCompletacionDialog from '../../components/solicitudes/ConfirmarCompletacionDialog.vue'
import PostularDialog from '../../components/solicitudes/PostularDialog.vue'
import { useSolicitudes } from '../../composables/solicitudes/useSolicitudes'
import { limpiarNotificacionesNuevas } from '../../composables/notificaciones/useNotificaciones'
import { useSolicitudEvents, type EventoSolicitud } from '../../composables/solicitudes/useSolicitudEvents'
import type { Solicitud } from '../../types/solicitudes'

const router = useRouter()
const toast = useToast()
const propuestaVisible = ref(false)
const ofertaPostular = ref<Solicitud | null>(null)

const {
  solicitudes,
  cargando,
  total,
  page,
  totalPaginas,
  solicitudActiva,
  confirmarAccionVisible,
  motivoRechazo,
  confirmarRechazar,
  ejecutarAccion,
  cerrarConfirmacion,
  cargar,
  irPagina,
} = useSolicitudes()

const confirmarCompletacionVisible = ref(false)

function abrirConfirmarCompletacion(solicitud: Solicitud) {
  solicitudActiva.value = solicitud
  confirmarCompletacionVisible.value = true
}

function cerrarConfirmarCompletacion() {
  confirmarCompletacionVisible.value = false
}

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` }))

function onSolicitudNueva(event: CustomEvent<EventoSolicitud>) {
  const payload = event.detail
  const cliente = payload?.solicitud?.cliente
  toast.add({
    severity: 'success',
    summary: 'Nueva solicitud',
    detail: `${cliente?.nombres ?? 'Un cliente'} quiere un servicio. Ábrela para responder.`,
    life: 6000,
  })
  void cargar()
}

function abrirPostulacion(solicitud: Solicitud) {
  ofertaPostular.value = solicitud
  propuestaVisible.value = true
}

function verDetalle(solicitud: Solicitud) {
  void router.push({ name: 'solicitud-detalle', params: { id: solicitud.id } })
}

useSolicitudEvents({
  nueva: onSolicitudNueva,
  actualizada: () => void cargar(),
})

limpiarNotificacionesNuevas()
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
          <SolicitudRecibidaCard
            v-else
            :solicitud="item as Solicitud"
            @postular="abrirPostulacion(item as Solicitud)"
            @completar="abrirConfirmarCompletacion(item as Solicitud)"
            @rechazar="confirmarRechazar(item as Solicitud)"
            @ver-detalle="verDetalle(item as Solicitud)"
          />
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

      <PostularDialog
        v-model:visible="propuestaVisible"
        :solicitud="ofertaPostular"
        @enviada="cargar"
      />

      <Dialog
        v-model:visible="confirmarAccionVisible"
        header="Rechazar solicitud"
        modal
        class="w-full max-w-sm"
      >
        <div class="flex flex-col gap-2">
          <p class="text-sm text-ink">
            Indica al cliente el motivo por el que no puedes atender esta solicitud.
          </p>
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
            <Button label="Rechazar" icon="pi pi-times" severity="warn" @click="ejecutarAccion" />
          </div>
        </template>
      </Dialog>

      <ConfirmarCompletacionDialog
        :visible="confirmarCompletacionVisible"
        :solicitud-id="solicitudActiva?.id ?? ''"
        @close="cerrarConfirmarCompletacion"
        @confirmado="cerrarConfirmarCompletacion"
      />
    </section>
  </div>
</template>
