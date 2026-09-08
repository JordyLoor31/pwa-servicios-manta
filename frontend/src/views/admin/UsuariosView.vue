<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useUsuariosAdmin } from '../../composables/usuarios/useUsuariosAdmin'

const { usuarios, total, page, limit, cargando, cargar, onPage } = useUsuariosAdmin()

const placeholders = ref(Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` })))

const filas = computed(() => (cargando.value ? placeholders.value : usuarios.value))

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
          <h1 class="text-2xl font-semibold text-ink">Gestión de usuarios</h1>
          <p class="mt-1 text-sm text-muted">Consulta todos los usuarios registrados en la plataforma.</p>
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
          table-style="min-width: 40rem"
          class="w-full"
          @page="onPage"
        >
          <Column header="Nombres" class="w-2/5">
            <template #body="{ data }">
              <template v-if="cargando">
                <div class="flex items-center gap-3">
                  <Skeleton shape="circle" size="2.5rem" />
                  <div class="flex flex-col gap-1">
                    <Skeleton width="8rem" height="0.6rem" />
                    <Skeleton width="5rem" height="0.55rem" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pacific text-sm font-semibold text-white"
                  >
                    {{ `${data.nombres?.[0] ?? ''}${data.apellidos?.[0] ?? ''}`.toUpperCase() }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-ink">{{ data.nombres }} {{ data.apellidos }}</span>
                    <span class="text-xs text-muted">{{ data.rol }}</span>
                  </div>
                </div>
              </template>
            </template>
          </Column>
          <Column header="Correo" class="w-2/5">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="12rem" height="0.8rem" />
              <span v-else class="text-sm text-ink">{{ data.email }}</span>
            </template>
          </Column>
          <Column header="Estado" class="w-1/5">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="6rem" height="1.5rem" />
              <Tag v-else :value="data.estado" :severity="severidadEstado(data.estado)" />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <i class="pi pi-users text-3xl text-muted" />
              <p class="text-sm text-muted">Aún no hay usuarios registrados.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </section>
  </div>
</template>