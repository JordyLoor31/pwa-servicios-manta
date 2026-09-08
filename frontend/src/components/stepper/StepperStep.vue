<script setup lang="ts">
import Divider from 'primevue/divider'

interface A11yAttrs {
  root: Record<string, unknown>
  header: Record<string, unknown>
}

defineProps<{
  value: number
  icono: string
  activeStep: number
  a11y?: A11yAttrs
  primero?: boolean
  ultimo?: boolean
}>()

defineEmits<{ activar: [] }>()
</script>

<template>
  <div
    class="flex flex-row items-center"
    :class="[!primero && 'pl-2', !ultimo && 'flex-auto gap-2']"
    v-bind="a11y?.root"
  >
    <button
      type="button"
      class="inline-flex flex-col gap-2 border-0 bg-transparent"
      v-bind="a11y?.header"
      @click="$emit('activar')"
    >
      <span
        :class="[
          'inline-flex h-12 w-12 items-center justify-center rounded-full border-2',
          value <= activeStep ? 'border-pacific bg-pacific text-white' : 'border-ink/20 text-muted',
        ]"
      >
        <i :class="icono" class="pi" />
      </span>
    </button>
    <Divider v-if="!ultimo" />
  </div>
</template>