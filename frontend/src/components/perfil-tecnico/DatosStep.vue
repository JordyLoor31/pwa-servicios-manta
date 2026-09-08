<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const anios = defineModel<number | null>('anios')
const radio = defineModel<number | null>('radio')
const biografia = defineModel<string>('biografia', { default: '' })

defineProps<{ cargando: boolean }>()

defineEmits<{ continuar: [] }>()
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-md flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Datos del técnico</div>
    <p class="text-center text-sm text-muted">Cuéntanos tu experiencia y cobertura para publicar tu perfil.</p>

    <div class="flex flex-col gap-1.5">
      <label for="anios" class="text-sm font-semibold text-ink">Años de experiencia</label>
      <InputNumber id="anios" v-model="anios" :min="0" :max="100" placeholder="Ej. 5" fluid />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="radio" class="text-sm font-semibold text-ink">Radio de cobertura (km)</label>
      <InputNumber
        id="radio"
        v-model="radio"
        :min="0"
        :max="999"
        :max-fraction-digits="2"
        placeholder="Ej. 15"
        fluid
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="biografia" class="text-sm font-semibold text-ink">Biografía</label>
      <Textarea id="biografia" v-model="biografia" rows="4" placeholder="Describe tu experiencia y especialidad" />
    </div>
  </div>
  <div class="flex justify-end pt-5">
    <Button :loading="cargando" @click="$emit('continuar')">
      Guardar y continuar
      <i class="pi pi-arrow-right ml-2" />
    </Button>
  </div>
</template>