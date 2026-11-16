<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Rating from 'primevue/rating'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { solicitudesApi } from '../../services/solicitudes'
import type { Solicitud } from '../../types/solicitudes'

const MAX_COMENTARIO = 1000

const props = defineProps<{
  visible: boolean
  solicitud: Solicitud | null
}>()

const emit = defineEmits<{
  close: []
  calificada: []
}>()

const toast = useToast()
const calificacion = ref<number | null>(null)
const comentario = ref('')
const enviando = ref(false)

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) {
      calificacion.value = null
      comentario.value = ''
    }
  },
)

async function enviar() {
  if (!props.solicitud) return
  if (!calificacion.value) {
    toast.add({
      severity: 'warn',
      summary: 'Falta la calificación',
      detail: 'Selecciona de 1 a 5 estrellas.',
      life: 3000,
    })
    return
  }
  enviando.value = true
  try {
    await solicitudesApi.calificar(props.solicitud.id, {
      calificacion: calificacion.value,
      comentario: comentario.value.trim() || undefined,
    })
    toast.add({
      severity: 'success',
      summary: 'Gracias por tu calificación',
      detail: 'Tu reseña ayuda a otros clientes a elegir un técnico.',
      life: 4000,
    })
    emit('calificada')
    emit('close')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo enviar la calificación',
      life: 4000,
    })
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Calificar servicio"
    modal
    class="w-full max-w-md"
    @hide="emit('close')"
  >
    <div v-if="solicitud" class="flex flex-col gap-4">
      <p class="text-sm text-muted">
        ¿Cómo fue tu experiencia con
        <span class="font-semibold text-ink">
          {{ solicitud.tecnico?.nombres ?? 'el técnico' }} {{ solicitud.tecnico?.apellidos ?? '' }}
        </span>
        ?
      </p>

      <div class="flex flex-col items-center gap-2 rounded-lg bg-pacific/5 p-4">
        <Rating v-model="calificacion" :cancel="false" />
        <p class="text-sm text-muted">
          {{ calificacion ? `${calificacion} de 5 estrellas` : 'Selecciona una calificación' }}
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="comentario-calificacion" class="text-sm font-medium text-ink">
          Comentario (opcional)
        </label>
        <Textarea
          id="comentario-calificacion"
          v-model="comentario"
          rows="4"
          auto-resize
          :maxlength="MAX_COMENTARIO"
          placeholder="Cuéntanos cómo fue el servicio..."
          class="w-full"
        />
        <p class="text-right text-xs text-muted">{{ comentario.length }}/{{ MAX_COMENTARIO }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="emit('close')" />
        <Button
          label="Enviar calificación"
          icon="pi pi-star-fill"
          :loading="enviando"
          @click="enviar"
        />
      </div>
    </template>
  </Dialog>
</template>
