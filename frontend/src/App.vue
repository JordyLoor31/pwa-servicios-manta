<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { conectarNotificaciones } from './composables/notificaciones/useNotificaciones'

onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (token) conectarNotificaciones(token)
})
</script>

<template>
  <RouterView />
</template>