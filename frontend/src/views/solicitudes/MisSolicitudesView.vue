<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useSolicitudes } from '../../composables/solicitudes/useSolicitudes'
import type { Solicitud } from '../../types/solicitudes'
import { estadoSeveridad, estadoLabel } from '../../utils/solicitudes'

const {
  solicitudes,
  cargando,
  total,
  page,
  totalPaginas,
  formAbierto,
  detalleVisible,
  solicitudActiva,
  confirmarAccionVisible,
  tecnicos,
  cargandoTecnicos,
  form,
  abrirFormulario,
  crear,
  irPagina,
  verDetalle,
  cerrarDetalle,
  confirmarCancelar,
  ejecutarAccion,
  cerrarConfirmacion,
} = useSolicitudes()

const placeholders = Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` }))
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
                  {{ (item as Solicitud).tecnico.nombres }} {{ (item as Solicitud).tecnico.apellidos }}
                </span>
                <Tag
                  :value="estadoLabel((item as Solicitud).estado)"
                  :severity="estadoSeveridad((item as Solicitud).estado)"
                />
              </div>
              <div class="flex gap-2">
                <Button
                  v-if="(item as Solicitud).estado === 'pendiente' || (item as Solicitud).estado === 'aceptada'"
                  label="Cancelar"
                  icon="pi pi-times"
                  severity="warn"
                  variant="outlined"
                  size="small"
                  @click="confirmarCancelar(item as Solicitud)"
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

      <Dialog v-model:visible="formAbierto" header="Nueva solicitud de servicio" modal class="w-full max-w-lg">
        <div class="mt-2 flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="tecnico" class="text-sm font-medium text-ink">Técnico *</label>
            <Select
              id="tecnico"
              v-model="form.tecnico_id"
              :options="tecnicos"
              option-label="nombres"
              :loading="cargandoTecnicos"
              placeholder="Elige un técnico"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-pacific" />
                  <span>{{ option.nombres }} {{ option.apellidos }}</span>
                  <Tag
                    v-if="option.verificado"
                    value="Verificado"
                    icon="pi pi-shield-check"
                    severity="success"
                    class="ml-auto"
                  />
                </div>
              </template>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="descripcion" class="text-sm font-medium text-ink">Describe lo que necesitas *</label>
            <Textarea
              id="descripcion"
              v-model="form.descripcion"
              rows="4"
              auto-resize
              placeholder="Ej.: Necesito reparar la lavadora, el motor no gira y hace ruido."
              class="w-full"
            />
          </div>
          <FloatLabel variant="on">
            <InputText id="direccion" v-model="form.direccion" class="w-full" />
            <label for="direccion">Dirección del servicio (opcional)</label>
          </FloatLabel>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="formAbierto = false" />
            <Button label="Enviar solicitud" icon="pi pi-send" @click="crear" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="detalleVisible" header="Detalle de la solicitud" modal class="w-full max-w-lg">
        <div v-if="solicitudActiva" class="mt-2 flex flex-col gap-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-ink">
              {{ solicitudActiva.tecnico.nombres }} {{ solicitudActiva.tecnico.apellidos }}
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
              v-if="
                solicitudActiva &&
                (solicitudActiva.estado === 'pendiente' || solicitudActiva.estado === 'aceptada')
              "
              label="Cancelar solicitud"
              icon="pi pi-times"
              severity="warn"
              variant="outlined"
              @click="confirmarCancelar(solicitudActiva)"
            />
            <Button label="Cerrar" severity="secondary" @click="cerrarDetalle" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="confirmarAccionVisible" header="Cancelar solicitud" modal class="w-full max-w-sm">
        <p class="text-sm text-ink">
          ¿Seguro que deseas cancelar esta solicitud a
          <span class="font-semibold">
            {{ solicitudActiva?.tecnico.nombres }} {{ solicitudActiva?.tecnico.apellidos }}
          </span>
          ? La cancelación no se puede deshacer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="No, mantenerla" severity="secondary" @click="cerrarConfirmacion" />
            <Button label="Sí, cancelar" icon="pi pi-times" severity="danger" @click="ejecutarAccion" />
          </div>
        </template>
      </Dialog>
    </section>
  </div>
</template>