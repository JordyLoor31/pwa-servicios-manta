<script setup lang="ts">
import Button from 'primevue/button'

defineEmits<{ inicio: [] }>()
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-3 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-turquoise-50 text-turquoise-600">
      <i class="pi pi-check text-2xl" />
    </div>
    <div class="text-lg font-semibold text-ink">Todo listo</div>
    <p class="text-sm leading-relaxed text-muted">
      Tu perfil de técnico quedó registrado. Puedes completar más información desde el menú lateral.
    </p>
  </div>
  <div class="flex justify-end pt-5">
    <Button label="Volver al inicio" @click="$emit('inicio')">
      <i class="pi pi-home ml-2" />
    </Button>
  </div>
</template>