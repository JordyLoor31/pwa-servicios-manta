<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import CategoriaFormDialog from '../../components/categorias/CategoriaFormDialog.vue'
import { useCategoriasAdmin } from '../../composables/categorias/useCategoriasAdmin'
import type { CategoriaServicio } from '../../types/categorias'

const {
  categorias,
  cargando,
  guardando,
  eliminando,
  dialogoVisible,
  modo,
  form,
  categoriaActiva,
  eliminarVisible,
  abrirCrear,
  abrirEditar,
  abrirVer,
  guardar,
  confirmarEliminar,
  eliminar,
} = useCategoriasAdmin()

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const itemMenu = (label: string, icono: string, comando: () => void, clase?: string) => ({
  label,
  icon: icono,
  class: clase,
  command: comando,
})

const opciones = computed(() => {
  const categoria = categoriaActiva.value
  if (!categoria) return []
  return [
    itemMenu('Ver', 'pi pi-eye', () => abrirVer(categoria)),
    itemMenu('Editar', 'pi pi-pencil', () => abrirEditar(categoria)),
    itemMenu('Eliminar', 'pi pi-trash', () => confirmarEliminar(categoria), 'text-red-500'),
  ]
})

function abrirMenu(event: Event, categoria: CategoriaServicio) {
  categoriaActiva.value = categoria
  menuRef.value?.toggle(event)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Toast />
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Gestión de categorías</h1>
          <p class="mt-1 text-sm text-muted">Administra las categorías de servicios disponibles en la plataforma.</p>
        </div>
        <Button label="Nueva categoría" icon="pi pi-plus" @click="abrirCrear" />
      </div>

      <div class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm sm:p-5">
        <DataTable
          :value="categorias"
          :loading="cargando"
          paginator
          :rows="5"
          :rows-per-page-options="[5, 10, 20]"
          :current-page-report-template="'Mostrando {first}-{last} de {totalRecords}'"
          paginator-template="FirstPageLink PrevPageLink PageLinks CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
          table-style="min-width: 42rem"
          class="w-full"
        >
          <Column field="nombre" header="Nombre" :sortable="true" body-class="w-1/2">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-turquoise-50 text-turquoise-600"
                >
                  <i :class="data.icono || 'pi pi-tag'" />
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-ink">{{ data.nombre }}</span>
                  <span class="max-w-60 truncate text-xs text-muted">{{ data.descripcion || 'Sin descripción' }}</span>
                </div>
              </div>
            </template>
          </Column>
          <Column field="activa" header="Estado" :sortable="true" style="width: 12rem">
            <template #body="{ data }">
              <Tag v-if="data.activa" value="Activa" severity="success" />
              <Tag v-else value="Inactiva" severity="secondary" />
            </template>
          </Column>
          <Column header="Acciones" style="width: 6rem" body-class="text-center">
            <template #body="{ data }">
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                aria-label="Acciones"
                @click="abrirMenu($event, data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <i class="pi pi-tags text-3xl text-muted" />
              <p class="text-sm text-muted">Aún no hay categorías.</p>
            </div>
          </template>
        </DataTable>
      </div>

      <Menu ref="menuRef" :model="opciones" popup />

      <CategoriaFormDialog
        v-model:visible="dialogoVisible"
        v-model:form="form"
        :modo="modo"
        :guardando="guardando"
        @guardar="guardar"
      />

      <Dialog v-model:visible="eliminarVisible" header="Eliminar categoría" modal class="w-full max-w-sm">
        <p class="text-sm text-ink">
          ¿Seguro que deseas eliminar la categoría
          <span class="font-semibold">"{{ categoriaActiva?.nombre }}"</span>? Esta acción no se puede deshacer.
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