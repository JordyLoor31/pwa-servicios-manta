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
import {
  useCertificaciones,
  ETIQUETAS_ESTADO,
  SEVERIDAD_ESTADO,
  formatearFecha,
} from '../../composables/certificaciones/useCertificaciones'
import type { Certificacion } from '../../types/certificaciones'

const {
  certificaciones,
  cargando,
  guardando,
  eliminando,
  formVisible,
  confirmarEliminarVisible,
  certificacionActiva,
  form,
  cargar,
  abrirCrear,
  guardar,
  pedirEliminar,
  eliminar,
} = useCertificaciones()

const placeholders = ref(Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` })))
const filas = computed(() => (cargando.value ? placeholders.value : certificaciones.value))

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const opciones = computed(() => {
  const certificacion = certificacionActiva.value
  if (!certificacion) return []
  return [
    { label: 'Ver documento', icon: 'pi pi-external-link', command: () => window.open(certificacion.url_documento, '_blank') },
    { label: 'Eliminar', icon: 'pi pi-trash', class: 'text-red-500', command: () => pedirEliminar(certificacion) },
  ]
})

function abrirMenu(event: Event, certificacion: Certificacion) {
  certificacionActiva.value = certificacion
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
          <h1 class="text-2xl font-semibold text-ink">Mis certificaciones</h1>
          <p class="mt-1 text-sm text-muted">
            Sube documentos que acrediten tu experiencia. Un administrador debe aprobarlos.
          </p>
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
          <Button label="Agregar certificación" icon="pi pi-plus" @click="abrirCrear" />
        </div>
      </div>

      <div v-if="certificaciones.length === 0 && !cargando" class="py-16 text-center">
        <i class="pi pi-id-card text-5xl text-muted" />
        <p class="mt-4 text-sm text-muted">Aún no tienes certificaciones registradas.</p>
        <Button label="Agregar mi primera certificación" icon="pi pi-plus" class="mt-4" @click="abrirCrear" />
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in filas"
          :key="item.id"
          class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm"
        >
          <template v-if="cargando">
            <div class="flex items-center justify-between">
              <Skeleton width="10rem" height="1.5rem" />
            </div>
            <Skeleton width="70%" height="0.9rem" class="mt-3" />
            <Skeleton width="40%" height="0.8rem" class="mt-2" />
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Tag
                  :value="ETIQUETAS_ESTADO[(item as Certificacion).estado]"
                  :severity="SEVERIDAD_ESTADO[(item as Certificacion).estado]"
                />
              </div>
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                aria-label="Acciones certificación"
                @click="abrirMenu($event, item as Certificacion)"
              />
            </div>
            <p class="mt-3 font-semibold text-ink">{{ (item as Certificacion).tipo_documento }}</p>
            <a
              :href="(item as Certificacion).url_documento"
              target="_blank"
              rel="noopener"
              class="mt-1 flex items-center gap-1 truncate text-sm text-pacific hover:underline"
            >
              <i class="pi pi-external-link" />{{ (item as Certificacion).url_documento }}
            </a>
            <p class="mt-2 text-xs text-muted">
              Creada el {{ formatearFecha((item as Certificacion).fecha_creacion) }}
            </p>
            <p v-if="(item as Certificacion).fecha_revision" class="mt-0.5 text-xs text-muted">
              Revisada el {{ formatearFecha((item as Certificacion).fecha_revision) }}
            </p>
          </template>
        </div>
      </div>

      <Menu ref="menuRef" :model="opciones" popup />

      <Dialog v-model:visible="formVisible" header="Nueva certificación" modal class="w-full max-w-lg">
        <div class="mt-2 flex flex-col gap-4">
          <FloatLabel variant="on">
            <InputText id="tipo_documento" v-model="form.tipo_documento" class="w-full" />
            <label for="tipo_documento">Tipo de documento *</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText id="url_documento" v-model="form.url_documento" class="w-full" placeholder="https://..." />
            <label for="url_documento">URL del documento *</label>
          </FloatLabel>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="formVisible = false" />
            <Button label="Guardar" icon="pi pi-check" :loading="guardando" @click="guardar" />
          </div>
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmarEliminarVisible"
        header="Eliminar certificación"
        modal
        class="w-full max-w-sm"
      >
        <p class="text-sm text-ink">
          ¿Deseas eliminar la certificación
          <span class="font-semibold">{{ certificacionActiva?.tipo_documento }}</span
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