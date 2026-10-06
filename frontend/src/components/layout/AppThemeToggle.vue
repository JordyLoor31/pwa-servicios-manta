<script setup lang="ts">
import ToggleSwitch from 'primevue/toggleswitch'

defineProps<{ isDark: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <div class="flex items-center justify-between rounded-xl border border-pacific/10 px-3 py-2.5">
    <span class="flex items-center gap-3 text-sm font-medium text-ink">
      <i :class="isDark ? 'pi pi-moon' : 'pi pi-sun'" class="w-5 text-pacific" />
      {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
    </span>
    <ToggleSwitch :model-value="isDark" @update:model-value="$emit('toggle')" aria-label="Cambiar modo oscuro" />
  </div>
</template>
