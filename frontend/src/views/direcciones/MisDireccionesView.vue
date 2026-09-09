<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useDirecciones } from '../../composables/direcciones/useDirecciones'
import type { Direccion } from '../../types/direcciones'

const {
  direcciones,
  cargando,
  guardando,
  eliminando,
  direccionActiva,
  formVisible,
  confirmarPrincipalVisible,
  confirmarEliminarVisible,
  form,
  cargar,
  abrirCrear,
  abrirEditar,
  guardar,
  pedirPrincipal,
  establecerPrincipal,
  pedirEliminar,
  eliminar,
} = useDirecciones()

const placeholders = ref(Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` })))
const filas = computed(() => (cargando.value ? placeholders.value : direcciones.value))

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const opciones = computed(() => {
  const direccion = direccionActiva.value
  if (!direccion) return []
  return [
    {
      label: direccion.es_principal ? 'Ya es la principal' : 'Establecer como principal',
      icon: 'pi pi-star',
      disabled: direccion.es_principal,
      command: () => pedirPrincipal(direccion),
    },
    { label: 'Editar', icon: 'pi pi-pencil', command: () => abrirEditar(direccion) },
    { label: 'Eliminar', icon: 'pi pi-trash', class: 'text-red-500', command: () => pedirEliminar(direccion) },
  ]
})

function abrirMenu(event: Event, direccion: Direccion) {
  direccionActiva.value = direccion
  menuRef.value?.toggle(event)
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
          <h1 class="text-2xl font-semibold text-ink">Mis direcciones</h1>
          <p class="mt-1 text-sm text-muted">Gestiona las direcciones donde recibes servicios.</p>
        </div>
        <div class="flex gap-2">
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            variant="outlined"
            :disabled="cargando"
            @click="cargar"
          />
          <Button label="Agregar dirección" icon="pi pi-plus" @click="abrirCrear" />
        </div>
      </div>

      <div v-if="direcciones.length === 0 && !cargando" class="py-16 text-center">
        <i class="pi pi-map-marker text-5xl text-muted" />
        <p class="mt-4 text-sm text-muted">Aún no tienes direcciones registradas.</p>
        <Button label="Agregar mi primera dirección" icon="pi pi-plus" class="mt-4" @click="abrirCrear" />
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in filas"
          :key="item.id"
          class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm"
        >
          <template v-if="cargando">
            <div class="flex items-center justify-between">
              <Skeleton width="6rem" height="1.5rem" />
              <Skeleton shape="circle" size="2rem" />
            </div>
            <Skeleton width="100%" height="0.9rem" class="mt-3" />
            <Skeleton width="60%" height="0.8rem" class="mt-2" />
            <Skeleton width="40%" height="0.8rem" class="mt-2" />
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-ink">{{ (item as Direccion).etiqueta || 'Dirección' }}</span>
                <Tag
                  v-if="(item as Direccion).es_principal"
                  value="Principal"
                  icon="pi pi-star"
                  severity="success"
                />
              </div>
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                aria-label="Acciones"
                @click="abrirMenu($event, item as Direccion)"
              />
            </div>
            <p class="mt-3 text-sm text-ink">{{ (item as Direccion).direccion_texto }}</p>
            <p v-if="(item as Direccion).referencia" class="mt-1 text-sm text-muted">
              <i class="pi pi-comment mr-1" />{{ (item as Direccion).referencia }}
            </p>
            <p class="mt-1 text-sm text-muted">
              <i class="pi pi-map mr-1" />{{ (item as Direccion).ciudad }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ (item as Direccion).latitud }}, {{ (item as Direccion).longitud }}
            </p>
          </template>
        </div>
      </div>

      <Menu ref="menuRef" :model="opciones" popup />

      <Dialog v-model:visible="formVisible" :header="direccionActiva ? 'Editar dirección' : 'Nueva dirección'" modal class="w-full max-w-lg">
        <div class="mt-2 flex flex-col gap-4">
          <FloatLabel variant="on">
            <InputText id="etiqueta" v-model="form.etiqueta" class="w-full" />
            <label for="etiqueta">Etiqueta (opcional)</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText id="direccion_texto" v-model="form.direccion_texto" class="w-full" />
            <label for="direccion_texto">Dirección *</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText id="referencia" v-model="form.referencia" class="w-full" />
            <label for="referencia">Referencia (opcional)</label>
          </FloatLabel>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatLabel variant="on">
              <InputText
                id="latitud"
                v-model="form.latitud"
                inputmode="decimal"
                class="w-full"
              />
              <label for="latitud">Latitud *</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                id="longitud"
                v-model="form.longitud"
                inputmode="decimal"
                class="w-full"
              />
              <label for="longitud">Longitud *</label>
            </FloatLabel>
          </div>
          <FloatLabel variant="on">
            <InputText id="ciudad" v-model="form.ciudad" class="w-full" />
            <label for="ciudad">Ciudad</label>
          </FloatLabel>
          <div class="flex items-center gap-3">
            <Button
              label="Principal"
              :icon="form.es_principal ? 'pi pi-star' : 'pi pi-star-o'"
              :severity="form.es_principal ? 'success' : 'secondary'"
              variant="outlined"
              @click="form.es_principal = !form.es_principal"
            />
            <span class="text-sm text-muted">Marcar como dirección principal</span>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="formVisible = false" />
            <Button label="Guardar" icon="pi pi-check" :loading="guardando" @click="guardar" />
          </div>
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmarPrincipalVisible"
        header="Dirección principal"
        modal
        class="w-full max-w-sm"
      >
        <p class="text-sm text-ink">
          ¿Deseas que
          <span class="font-semibold">{{ direccionActiva?.etiqueta || 'esta dirección' }}</span>
          sea tu dirección principal?
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="confirmarPrincipalVisible = false" />
            <Button label="Sí, establecer" icon="pi pi-star" @click="establecerPrincipal" />
          </div>
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmarEliminarVisible"
        header="Eliminar dirección"
        modal
        class="w-full max-w-sm"
      >
        <p class="text-sm text-ink">
          ¿Deseas eliminar la dirección
          <span class="font-semibold">{{ direccionActiva?.etiqueta || 'sin etiqueta' }}</span
          >? Esta acción no se puede deshacer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="confirmarEliminarVisible = false" />
            <Button label="Eliminar" icon="pi pi-trash" severity="danger" :loading="eliminando" @click="eliminar" />
          </div>
        </template>
      </Dialog>
    </section>
  </div>
</template>