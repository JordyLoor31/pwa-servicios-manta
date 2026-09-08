<script setup lang="ts">
import Button from 'primevue/button'

defineEmits<{ volver: []; continuar: [] }>()
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-4 text-center">
    <div class="text-lg font-semibold text-ink">Información adicional</div>
    <p class="text-sm leading-relaxed text-muted">
      Tu disponibilidad semanal y certificaciones se gestionarán desde
      <span class="font-semibold text-ink">Mi perfil</span>.
    </p>
  </div>
  <div class="flex justify-between pt-5">
    <Button severity="secondary" variant="outlined" @click="$emit('volver')">
      <i class="pi pi-arrow-left mr-2" />
      Volver
    </Button>
    <Button @click="$emit('continuar')">
      Continuar
      <i class="pi pi-arrow-right ml-2" />
    </Button>
  </div>
</template>