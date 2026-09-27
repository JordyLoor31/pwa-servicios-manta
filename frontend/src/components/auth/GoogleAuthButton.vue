<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useGoogleAuth } from '../../composables/auth/useGoogleAuth'
import type { RolUsuario } from '../../composables/auth/useAuthz'

const props = withDefaults(defineProps<{ rol?: RolUsuario }>(), { rol: undefined })

const { renderizar } = useGoogleAuth()
const contenedor = ref<HTMLElement | null>(null)

onMounted(() => {
  if (contenedor.value) void renderizar(contenedor.value, props.rol)
})

watch(
  () => props.rol,
  (nuevoRol) => {
    if (contenedor.value) void renderizar(contenedor.value, nuevoRol)
  },
)
</script>

<template>
  <div ref="contenedor" class="google-btn-container w-full"></div>
</template>