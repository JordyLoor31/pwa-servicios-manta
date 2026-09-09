<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import {
  useTarifasAdmin,
  OPCIONES_UNIDAD,
  etiquetaUnidad,
} from '../../composables/categorias/useTarifasAdmin'
import type { TarifaAdmin } from '../../types/tarifas'

const {
  tarifas,
  categoriasSinTarifa,
  cargando,
  guardando,
  eliminando,
  dialogoVisible,
  eliminarVisible,
  tarifaActiva,
  modo,
  form,
  cargar,
  abrirCrear,
  abrirEditar,
  guardar,
  confirmarEliminar,
  eliminar,
} = useTarifasAdmin()

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const opciones = computed(() => {
  const tarifa = tarifaActiva.value
  if (!tarifa) return []
  return [
    { label: 'Editar', icon: 'pi pi-pencil', command: () => abrirEditar(tarifa) },
    { label: 'Eliminar', icon: 'pi pi-trash', class: 'text-red-500', command: () => confirmarEliminar(tarifa) },
  ]
})

function abrirMenu(event: Event, tarifa: TarifaAdmin) {
  tarifaActiva.value = tarifa
  menuRef.value?.toggle(event)
}

function etiquetaFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

function seleccionarUnidad(valor: (typeof OPCIONES_UNIDAD)[number]['valor']) {
  form.unidad = valor
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
          <h1 class="text-2xl font-semibold text-ink">Tarifas por categoría</h1>
          <p class="mt-1 text-sm text-muted">
            Define el precio base por hora o por servicio para cada categoría.
          </p>
        </div>
        <Button
          label="Nueva tarifa"
          icon="pi pi-plus"
          :disabled="categoriasSinTarifa.length === 0"
          @click="abrirCrear"
        />
      </div>

      <div class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm sm:p-5">
        <DataTable
          :value="tarifas"
          :loading="cargando"
          paginator
          :rows="5"
          :rows-per-page-options="[5, 10, 20]"
          :current-page-report-template="'Mostrando {first}-{last} de {totalRecords}'"
          paginator-template="FirstPageLink PrevPageLink PageLinks CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
          table-style="min-width: 42rem"
          class="w-full"
        >
          <Column header="Categoría" body-class="w-1/3">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-turquoise-50 text-turquoise-600"
                >
                  <i :class="data.categoria_icono || 'pi pi-tag'" />
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-ink">{{ data.categoria_nombre }}</span>
                  <div class="flex items-center gap-2">
                    <span v-if="!data.categoria_activa" class="text-xs text-muted">Inactiva</span>
                  </div>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Precio base" style="width: 10rem">
            <template #body="{ data }">
              <span class="font-semibold text-ink">${{ data.precio_base }}</span>
            </template>
          </Column>
          <Column header="Unidad de cobro" style="width: 12rem">
            <template #body="{ data }">
              <Tag :value="etiquetaUnidad(data.unidad_cobro)" severity="info" />
            </template>
          </Column>
          <Column header="Actualización" style="width: 10rem">
            <template #body="{ data }">
              <span class="text-sm text-muted">{{ etiquetaFecha(data.fecha_actualizacion) }}</span>
            </template>
          </Column>
          <Column header="Acciones" style="width: 6rem" body-class="text-center">
            <template #body="{ data }">
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                aria-label="Acciones tarifa"
                @click="abrirMenu($event, data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <i class="pi pi-dollar text-3xl text-muted" />
              <p class="text-sm text-muted">Aún no hay tarifas configuradas.</p>
            </div>
          </template>
        </DataTable>
      </div>

      <Menu ref="menuRef" :model="opciones" popup />

      <Dialog
        v-model:visible="dialogoVisible"
        :header="modo === 'crear' ? 'Nueva tarifa' : 'Editar tarifa'"
        modal
        class="w-full max-w-md"
      >
        <div class="mt-2 flex flex-col gap-4">
          <template v-if="modo === 'crear'">
            <label class="text-sm font-medium text-ink">Categoría *</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="cat in categoriasSinTarifa"
                :key="cat.id"
                type="button"
                class="flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                :class="
                  form.categoria_id === cat.id
                    ? 'border-pacific bg-pacific/10 text-pacific'
                    : 'border-pacific/20 text-ink hover:bg-pacific/5'
                "
                @click="form.categoria_id = cat.id"
              >
                <i :class="cat.icono || 'pi pi-tag'" class="text-pacific" />
                {{ cat.nombre }}
              </button>
              <p v-if="categoriasSinTarifa.length === 0" class="text-sm text-muted">
                Todas las categorías ya tienen tarifa asignada.
              </p>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-3 rounded-lg border border-pacific/10 bg-cloud px-3 py-2 text-sm text-ink">
              <i :class="tarifaActiva?.categoria_icono || 'pi pi-tag'" class="text-pacific" />
              {{ tarifaActiva?.categoria_nombre }}
            </div>
          </template>

          <FloatLabel variant="on">
            <InputText
              id="precio_base"
              v-model="form.precio"
              inputmode="decimal"
              class="w-full"
            />
            <label for="precio_base">Precio base (USD) *</label>
          </FloatLabel>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">Cobro:</span>
            <Button
              v-for="op in OPCIONES_UNIDAD"
              :key="op.valor"
              :label="op.etiqueta"
              size="small"
              :severity="form.unidad === op.valor ? 'primary' : 'secondary'"
              :variant="form.unidad === op.valor ? undefined : 'outlined'"
              @click="seleccionarUnidad(op.valor)"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="dialogoVisible = false" />
            <Button label="Guardar" icon="pi pi-check" :loading="guardando" @click="guardar" />
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="eliminarVisible" header="Eliminar tarifa" modal class="w-full max-w-sm">
        <p class="text-sm text-ink">
          ¿Seguro que deseas eliminar la tarifa de
          <span class="font-semibold">"{{ tarifaActiva?.categoria_nombre }}"</span>? Esta acción no se puede
          deshacer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="eliminarVisible = false" />
            <Button label="Eliminar" icon="pi pi-trash" severity="danger" :loading="eliminando" @click="eliminar" />
          </div>
        </template>
      </Dialog>
    </section>
  </div>
</template>