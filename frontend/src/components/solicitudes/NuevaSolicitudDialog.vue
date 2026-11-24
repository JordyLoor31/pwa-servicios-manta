<script setup lang="ts">
import { watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputTags from 'primevue/inputtags'
import Listbox from 'primevue/listbox'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useNuevaSolicitud } from '../../composables/solicitudes/useNuevaSolicitud'
import type { Solicitud } from '../../types/solicitudes'
import { tiposServicioParaCategoria } from '../../utils/tiposServicio'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  creada: [solicitud: Solicitud]
}>()

function cerrar() {
  emit('update:visible', false)
}

const {
  categorias,
  categoriasSeleccionadas,
  serviciosPorCategoria,
  fechaServicio,
  duracionOferta,
  ofertaHastaFinDia,
  horasValidas,
  horaBusqueda,
  enviando,
  form,
  direcciones,
  direccionSeleccionadaId,
  iniciar,
  crear: crearSolicitud,
  actualizarServicios,
} = useNuevaSolicitud()

watch(() => props.visible, (abierto) => {
  if (abierto) iniciar()
})

async function submit() {
  const creada = await crearSolicitud()
  if (creada) {
    cerrar()
    emit('creada', creada)
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Nueva solicitud de servicio"
    modal
    class="w-full max-w-lg"
    @update:visible="cerrar"
  >
    <div class="mt-2 flex flex-col gap-4">
      <Message severity="info" :closable="false">
        Elige el servicio, cuándo lo necesitas, explica el trabajo y selecciona la dirección donde será atendido.
      </Message>
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

      <div
        v-for="categoria in categorias.filter((actual) => categoriasSeleccionadas.includes(actual.id))"
        :key="`servicios-${categoria.id}`"
        class="flex flex-col gap-1.5"
      >
        <label :for="`tipos-${categoria.id}`" class="text-sm font-medium text-ink">
          Tipo de servicio en {{ categoria.nombre }} *
        </label>
        <InputTags
          :id="`tipos-${categoria.id}`"
          :model-value="serviciosPorCategoria[categoria.id] ?? []"
          :maxlength="150"
          separator=","
          placeholder="Escribe un servicio y presiona Enter"
          class="w-full"
          @update:model-value="actualizarServicios(categoria.id, $event)"
        />
        <div class="flex flex-wrap gap-1.5">
          <Button
            v-for="tipo in tiposServicioParaCategoria(categoria.nombre)"
            :key="tipo"
            :label="tipo"
            size="small"
            severity="secondary"
            variant="outlined"
            :disabled="(serviciosPorCategoria[categoria.id] ?? []).includes(tipo)"
            @click="
              actualizarServicios(categoria.id, [
                ...(serviciosPorCategoria[categoria.id] ?? []),
                tipo,
              ])
            "
          />
        </div>
        <p class="text-xs text-muted">
          Puedes elegir una sugerencia o escribir otro tipo. Cada tag admite hasta 150 caracteres.
        </p>
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
          :options="[
            { label: '30 minutos', value: 30 },
            { label: '3 horas', value: 180 },
            { label: '6 horas', value: 360 },
            { label: '9 horas', value: 540 },
          ]"
          option-label="label"
          option-value="value"
          :disabled="ofertaHastaFinDia"
          class="w-full"
        />
        <div class="flex items-center gap-2">
          <Checkbox v-model="ofertaHastaFinDia" input-id="oferta-fin-dia" binary />
          <label for="oferta-fin-dia" class="text-sm text-ink">Mantener hasta el fin del día</label>
        </div>
        <p class="text-xs text-muted">Durante este tiempo los técnicos podrán enviarte sus propuestas.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="hora" class="text-sm font-medium text-ink">Hora en que deseas el servicio *</label>
        <Select
          id="hora"
          v-model="horaBusqueda"
          :options="horasValidas"
          placeholder="Selecciona una hora"
          class="w-full"
        />
        <p v-if="horasValidas.length === 0" class="text-xs text-amber-600">
          No quedan horarios disponibles hoy. Selecciona otro día.
        </p>
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
        <Button label="Cancelar" severity="secondary" @click="cerrar" />
        <Button label="Enviar solicitud" icon="pi pi-send" :loading="enviando" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>