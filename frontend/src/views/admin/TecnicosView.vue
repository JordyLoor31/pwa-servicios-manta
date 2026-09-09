<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useTecnicosAdmin } from '../../composables/tecnicos/useTecnicosAdmin'
import {
  ETIQUETAS_ESTADO,
  SEVERIDAD_ESTADO,
} from '../../composables/certificaciones/useCertificaciones'
import type { TecnicoAdminLista } from '../../types/tecnicos'

const {
  tecnicos,
  total,
  page,
  limit,
  cargando,
  busqueda,
  tecnicoActivo,
  detalle,
  detalleVisible,
  cargandoDetalle,
  procesando,
  cargar,
  onPage,
  onCambioBusqueda,
  limpiarBusqueda,
  abrirVer,
  verificar,
  revisarCertificacion,
  confirmarCambiarEstado,
} = useTecnicosAdmin()

const placeholders = ref(Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` })))
const filas = computed(() => (cargando.value ? placeholders.value : tecnicos.value))

function severidadEstado(estado: string) {
  if (estado === 'activo') return 'success'
  if (estado === 'suspendido') return 'danger'
  return 'secondary'
}

onMounted(cargar)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Toast />

      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Gestión de técnicos</h1>
          <p class="mt-1 text-sm text-muted">
            Revisa los perfiles técnicos y sus certificaciones.
          </p>
        </div>
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          severity="secondary"
          variant="outlined"
          :disabled="cargando"
          @click="cargar"
        />
      </div>

      <div class="mb-4">
        <div class="relative w-full max-w-sm">
          <i class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-muted" />
          <InputText
            v-model="busqueda"
            placeholder="Buscar por nombre, apellido o correo..."
            class="w-full !pl-9"
            @input="onCambioBusqueda(($event.target as HTMLInputElement).value)"
          />
          <Button
            v-if="busqueda"
            icon="pi pi-times"
            text
            rounded
            aria-label="Limpiar búsqueda"
            class="absolute right-1 top-1/2 z-10 -translate-y-1/2"
            @click="limpiarBusqueda"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm sm:p-5">
        <DataTable
          :value="filas"
          lazy
          paginator
          :rows="limit"
          :first="(page - 1) * limit"
          :total-records="total"
          :rows-per-page-options="[5, 10, 20]"
          :current-page-report-template="'Mostrando {first}-{last} de {totalRecords}'"
          paginator-template="FirstPageLink PrevPageLink PageLinks CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
          table-style="min-width: 42rem"
          class="w-full"
          @page="onPage"
        >
          <Column header="Nombres" class="w-1/4">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pacific text-sm font-semibold text-white"
                >
                  {{ `${data.nombres?.[0] ?? ''}${data.apellidos?.[0] ?? ''}`.toUpperCase() }}
                </div>
                <span class="font-medium text-ink">{{ data.nombres }} {{ data.apellidos }}</span>
              </div>
            </template>
          </Column>
          <Column header="Correo" class="w-1/4">
            <template #body="{ data }">
              <span class="text-sm text-ink">{{ data.email }}</span>
            </template>
          </Column>
          <Column header="Verificado" style="width: 9rem">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="6rem" height="1.5rem" />
              <Tag
                v-else
                :value="data.verificado ? 'Verificado' : 'No verificado'"
                :icon="data.verificado ? 'pi pi-shield' : 'pi pi-shield-plus'"
                :severity="data.verificado ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="Calificación" style="width: 6rem">
            <template #body="{ data }">
              <span class="text-sm text-ink">{{ data.calificacion_promedio }}</span>
            </template>
          </Column>
          <Column header="Estado" style="width: 8rem">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="6rem" height="1.5rem" />
              <Tag v-else :value="data.usuario_estado" :severity="severidadEstado(data.usuario_estado)" />
            </template>
          </Column>
          <Column header="Acciones" style="width: 6rem" body-class="text-center">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                text
                rounded
                aria-label="Ver detalle"
                :loading="procesando"
                @click="abrirVer(data as TecnicoAdminLista)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <i class="pi pi-wrench text-3xl text-muted" />
              <p class="text-sm text-muted">
                {{ busqueda ? 'No se encontraron técnicos para tu búsqueda.' : 'Aún no hay técnicos registrados.' }}
              </p>
            </div>
          </template>
        </DataTable>
      </div>

      <Dialog v-model:visible="detalleVisible" header="Detalle del técnico" modal class="w-full max-w-2xl">
        <div v-if="cargandoDetalle" class="flex flex-col gap-4">
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="80%" height="1rem" />
        </div>
        <div v-else-if="detalle" class="flex flex-col gap-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pacific text-lg font-semibold text-white"
              >
                {{ `${tecnicoActivo?.nombres?.[0] ?? ''}${tecnicoActivo?.apellidos?.[0] ?? ''}`.toUpperCase() }}
              </div>
              <div>
                <p class="text-lg font-semibold text-ink">
                  {{ tecnicoActivo?.nombres }} {{ tecnicoActivo?.apellidos }}
                </p>
                <p class="text-sm text-muted">{{ tecnicoActivo?.email }}</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <Tag
                :value="tecnicoActivo?.usuario_estado"
                :severity="severidadEstado(tecnicoActivo?.usuario_estado ?? '')"
              />
              <Button
                :label="tecnicoActivo?.usuario_estado === 'suspendido' ? 'Activar' : 'Suspender'"
                :icon="tecnicoActivo?.usuario_estado === 'suspendido' ? 'pi pi-check-circle' : 'pi pi-pause-circle'"
                :severity="tecnicoActivo?.usuario_estado === 'suspendido' ? 'success' : 'danger'"
                size="small"
                variant="outlined"
                :loading="procesando"
                @click="confirmarCambiarEstado(tecnicoActivo!)"
              />
            </div>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">Perfil</h3>
              <div class="flex items-center gap-2">
                <Tag
                  :value="detalle.perfil.verificado ? 'Verificado' : 'No verificado'"
                  :icon="detalle.perfil.verificado ? 'pi pi-shield' : 'pi pi-shield-plus'"
                  :severity="detalle.perfil.verificado ? 'success' : 'secondary'"
                />
                <Button
                  :label="detalle.perfil.verificado ? 'Quitar verificación' : 'Verificar'"
                  icon="pi pi-shield"
                  size="small"
                  :severity="detalle.perfil.verificado ? 'secondary' : 'success'"
                  variant="outlined"
                  :loading="procesando"
                  @click="verificar"
                />
              </div>
            </div>
            <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div class="rounded-xl bg-cloud p-3">
                <dt class="text-xs text-muted">Biografía</dt>
                <dd class="mt-1 text-ink">{{ detalle.perfil.biografia || '—' }}</dd>
              </div>
              <div class="rounded-xl bg-cloud p-3">
                <dt class="text-xs text-muted">Años de experiencia</dt>
                <dd class="mt-1 text-ink">{{ detalle.perfil.anios_experiencia ?? '—' }}</dd>
              </div>
              <div class="rounded-xl bg-cloud p-3">
                <dt class="text-xs text-muted">Radio de cobertura</dt>
                <dd class="mt-1 text-ink">
                  {{ detalle.perfil.radio_cobertura_km != null ? `${detalle.perfil.radio_cobertura_km} km` : '—' }}
                </dd>
              </div>
              <div class="rounded-xl bg-cloud p-3">
                <dt class="text-xs text-muted">Servicios completados</dt>
                <dd class="mt-1 text-ink">{{ detalle.perfil.total_servicios_completados }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Categorías</h3>
            <div v-if="detalle.categorias.length" class="flex flex-wrap gap-2">
              <Tag v-for="cat in detalle.categorias" :key="cat.id" :value="cat.nombre" severity="info" />
            </div>
            <p v-else class="text-sm text-muted">Sin categorías asignadas.</p>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Certificaciones</h3>
            <div v-if="detalle.certificaciones.length" class="flex flex-col gap-2">
              <div
                v-for="cert in detalle.certificaciones"
                :key="cert.id"
                class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pacific/10 bg-cloud p-3"
              >
                <div class="min-w-0">
                  <p class="font-medium text-ink">{{ cert.tipo_documento }}</p>
                  <a
                    :href="cert.url_documento"
                    target="_blank"
                    rel="noopener"
                    class="mt-0.5 flex items-center gap-1 truncate text-xs text-pacific hover:underline"
                  >
                    <i class="pi pi-external-link" />{{ cert.url_documento }}
                  </a>
                </div>
                <div class="flex items-center gap-2">
                  <Tag
                    :value="ETIQUETAS_ESTADO[cert.estado]"
                    :severity="SEVERIDAD_ESTADO[cert.estado]"
                  />
                  <template v-if="cert.estado === 'pendiente'">
                    <Button
                      icon="pi pi-check"
                      size="small"
                      :disabled="procesando"
                      aria-label="Aprobar certificación"
                      @click="revisarCertificacion(cert.id, 'aprobada')"
                    />
                    <Button
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      :disabled="procesando"
                      aria-label="Rechazar certificación"
                      @click="revisarCertificacion(cert.id, 'rechazada')"
                    />
                  </template>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted">Sin certificaciones registradas.</p>
          </div>
        </div>
        <template #footer>
          <Button label="Cerrar" severity="secondary" @click="detalleVisible = false" />
        </template>
      </Dialog>
    </section>
  </div>
</template>