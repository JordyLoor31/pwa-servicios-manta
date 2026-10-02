<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { conectarNotificaciones, solicitarPermisoNotificaciones } from './composables/notificaciones/useNotificaciones'

onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (token) {
    conectarNotificaciones(token)
    solicitarPermisoNotificaciones()
  }
})
</script>

<template>
  <RouterView />
</template>