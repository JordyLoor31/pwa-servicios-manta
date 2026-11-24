<script setup lang="ts">
import { computed, onMounted } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import RadioCoberturaMap from './RadioCoberturaMap.vue'
import AppProgressSpinner from '../layout/AppProgressSpinner.vue'
import { useDirecciones } from '../../composables/direcciones/useDirecciones'

const anios = defineModel<number | null>('anios')
const radio = defineModel<number | null>('radio', { default: null })
const biografia = defineModel<string>('biografia', { default: '' })

const props = defineProps<{
  cargando: boolean
  cargandoPerfil?: boolean
  errorCargandoPerfil?: boolean
}>()

defineEmits<{ continuar: [] }>()

const { direcciones, cargar } = useDirecciones()
const direccionPrincipal = computed(() =>
  direcciones.value.find((direccion) => direccion.es_principal) ?? direcciones.value[0] ?? null,
)

onMounted(() => {
  void cargar()
})

function actualizarRadio(event: { value: string | number | null | undefined }) {
  const valor = event.value
  const numero = valor == null || valor === '' ? null : Number(valor)
  radio.value = numero !== null && Number.isFinite(numero) ? numero : null
}
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-md flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Datos del técnico</div>
    <p class="text-center text-sm text-muted">Cuéntanos tu experiencia y cobertura para publicar tu perfil.</p>

    <div v-if="props.cargandoPerfil" class="flex justify-center py-8">
      <AppProgressSpinner />
    </div>
    <p v-else-if="props.errorCargandoPerfil" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
      No se pudo verificar el perfil guardado. Recarga la página antes de editarlo.
    </p>
    <template v-else>
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
          @input="actualizarRadio"
        />
      </div>

      <div v-if="direccionPrincipal && radio !== null && radio > 0" class="space-y-2">
        <RadioCoberturaMap
          :latitud="direccionPrincipal.latitud"
          :longitud="direccionPrincipal.longitud"
          :radio="radio"
        />
        <p class="text-xs text-muted">
          El círculo representa {{ radio }} km desde tu dirección principal
          <span v-if="direccionPrincipal.etiqueta">({{ direccionPrincipal.etiqueta }})</span>.
        </p>
      </div>
      <p v-else-if="radio !== null && radio > 0" class="text-xs text-muted">
        Agrega una dirección para visualizar tu cobertura en el mapa.
      </p>

      <div class="flex flex-col gap-1.5">
        <label for="biografia" class="text-sm font-semibold text-ink">Biografía</label>
        <Textarea id="biografia" v-model="biografia" rows="4" placeholder="Describe tu experiencia y especialidad" />
      </div>
    </template>
  </div>
  <div class="flex justify-end pt-5">
    <Button
      :loading="cargando"
      :disabled="props.cargandoPerfil || props.errorCargandoPerfil"
      @click="$emit('continuar')"
    >
      Guardar y continuar
      <i class="pi pi-arrow-right ml-2" />
    </Button>
  </div>
</template>