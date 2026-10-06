<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  canInstall: boolean
  isIOS: boolean
  showIosHint: boolean
}>()

const emit = defineEmits<{
  install: []
}>()
</script>

<template>
  <div v-if="canInstall" class="rounded-xl border border-pacific/10 px-3 py-2.5">
    <Button label="Instalar la app" icon="pi pi-download" class="w-full" severity="primary" @click="emit('install')" />
    <p v-if="showIosHint" class="mt-2 text-xs leading-relaxed text-muted">
      En {{ isIOS ? 'iOS' : 'Android' }}: toca el botón Compartir y elige
      «{{ isIOS ? 'Añadir a pantalla de inicio' : 'Añadir a la pantalla de inicio' }}» para instalar CamelloApp.
    </p>
  </div>
</template>
