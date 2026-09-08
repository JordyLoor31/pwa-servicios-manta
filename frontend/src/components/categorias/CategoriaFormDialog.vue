<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Label from 'primevue/label'
import type { CategoriaForm, CategoriaModo } from '../../types/categorias'

const props = defineProps<{
  modo: CategoriaModo
  guardando: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CategoriaForm>('form', { required: true })

const emit = defineEmits<{
  guardar: []
}>()

const esLectura = computed(() => props.modo === 'ver')

const titulo = computed(() => {
  switch (props.modo) {
    case 'crear':
      return 'Nueva categoría'
    case 'editar':
      return 'Editar categoría'
    default:
      return 'Detalle de categoría'
  }
})
</script>

<template>
  <Dialog v-model:visible="visible" :header="titulo" modal class="w-full max-w-md">
    <form class="flex flex-col gap-4" @submit.prevent="emit('guardar')">
      <div class="flex flex-col gap-1.5">
        <Label for="categoria-nombre">Nombre</Label>
        <InputText id="categoria-nombre" v-model="form.nombre" :disabled="esLectura" maxlength="80" />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="categoria-descripcion">Descripción</Label>
        <Textarea
          id="categoria-descripcion"
          v-model="form.descripcion"
          :disabled="esLectura"
          rows="3"
          auto-resize
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="categoria-icono">Ícono</Label>
        <InputText id="categoria-icono" v-model="form.icono" :disabled="esLectura" placeholder="pi pi-wrench" />
        <p class="text-xs text-muted">Clase de PrimeIcons, por ejemplo: pi pi-wrench.</p>
      </div>

      <div class="flex items-center justify-between rounded-xl border border-pacific/10 px-3 py-2.5">
        <span class="text-sm font-medium text-ink">Categoría activa</span>
        <ToggleSwitch v-model="form.activa" :disabled="esLectura" aria-label="Categoría activa" />
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <template v-if="esLectura">
          <Button label="Cerrar" severity="secondary" @click="visible = false" />
        </template>
        <template v-else>
          <Button label="Cancelar" severity="secondary" @click="visible = false" />
          <Button label="Guardar" type="submit" :loading="guardando" />
        </template>
      </div>
    </form>
  </Dialog>
</template>