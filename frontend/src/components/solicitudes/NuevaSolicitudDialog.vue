<script setup lang="ts">
import { watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useNuevaSolicitud } from '../../composables/solicitudes/useNuevaSolicitud'
import type { Solicitud } from '../../types/solicitudes'

const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ creada: [solicitud: Solicitud] }>()

const {
  categorias,
  categoriasSeleccionadas,
  fechaServicio,
  duracionOferta,
  horas,
  horaBusqueda,
  enviando,
  form,
  direcciones,
  direccionSeleccionadaId,
  iniciar,
  crear: crearSolicitud,
} = useNuevaSolicitud()

watch(visible, (abierto) => {
  if (abierto) iniciar()
})

async function submit() {
  const creada = await crearSolicitud()
  if (creada) {
    visible.value = false
    emit('creada', creada)
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Nueva solicitud de servicio" modal class="w-full max-w-lg">
    <div class="mt-2 flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label for="categorias" class="text-sm font-medium text-ink">Categoría del servicio *</label>
        <Listbox
          id="categorias"
          v-model="categoriasSeleccionadas"
          :options="categorias"
          multiple
          checkbox
          option-label="nombre"
          option-value="id"
          class="w-full"
        />
        <p v-if="categorias.length === 0" class="text-xs text-muted">Cargando categorías…</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="dia" class="text-sm font-medium text-ink">Día del servicio *</label>
        <DatePicker
          id="dia"
          v-model="fechaServicio"
          :min-date="new Date()"
          date-format="dd/mm/yy"
          class="w-full"
          show-icon
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="duracion-oferta" class="text-sm font-medium text-ink">¿Cuánto tiempo publicar la oferta?</label>
        <Select
          id="duracion-oferta"
          v-model="duracionOferta"
          :options="[{ label: '30 minutos', value: 30 }, { label: '1 hora', value: 60 }]"
          option-label="label"
          option-value="value"
          class="w-full"
        />
        <p class="text-xs text-muted">Durante este tiempo los técnicos podrán enviarte sus propuestas.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="hora" class="text-sm font-medium text-ink">Hora en que deseas el servicio *</label>
        <Select
          id="hora"
          v-model="horaBusqueda"
          :options="horas"
          placeholder="Selecciona una hora"
          class="w-full"
        />
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

      <div class="flex flex-col gap-1.5">
        <label for="direccion" class="text-sm font-medium text-ink">Dirección del servicio *</label>
        <Select
          id="direccion"
          v-model="direccionSeleccionadaId"
          :options="direcciones"
          option-label="etiqueta"
          option-value="id"
          :placeholder="direcciones.length ? 'Elige una dirección' : 'No tienes direcciones guardadas'"
          class="w-full"
        >
          <template #option="{ option }">
            <div class="flex flex-col">
              <span>{{ option.etiqueta || 'Dirección' }}</span>
              <span class="text-xs text-muted">{{ option.direccion_texto }}</span>
            </div>
          </template>
        </Select>
        <p v-if="direcciones.length > 0 && !direccionSeleccionadaId" class="text-xs text-muted">
          Selecciona una dirección para que al técnico le aparezca.
        </p>
        <p v-if="direcciones.length === 0" class="text-xs text-muted">
          Puedes agregar direcciones en "Mis direcciones" para seleccionarlas aquí.
        </p>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="visible = false" />
        <Button label="Enviar solicitud" icon="pi pi-send" :loading="enviando" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>