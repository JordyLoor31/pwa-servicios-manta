<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { conectarNotificaciones, solicitarPermisoNotificaciones } from './composables/notificaciones/useNotificaciones'
import { registrarSuscripcionPush } from './composables/notificaciones/usePush'
import WidgetActualizarApp from './components/widgets/WidgetActualizarApp.vue'

async function iniciar() {
  const token = localStorage.getItem('access_token')
  if (!token) return
  conectarNotificaciones(token)
  await solicitarPermisoNotificaciones()
  void registrarSuscripcionPush()
}

onMounted(() => {
  void iniciar()
})
</script>

<template>
  <WidgetActualizarApp />
  <RouterView />
</template>