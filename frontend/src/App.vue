<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { conectarNotificaciones, solicitarPermisoNotificaciones } from './composables/notificaciones/useNotificaciones'
import { registrarSuscripcionPush } from './composables/notificaciones/usePush'

async function iniciar() {
  const token = localStorage.getItem('access_token')
  if (!token) return
  conectarNotificaciones(token)
  await solicitarPermisoNotificaciones()
  void registrarSuscripcionPush()
}

const enLinea = ref(typeof navigator === 'undefined' || navigator.onLine)
function actualizarConexion() {
  enLinea.value = navigator.onLine
}

onMounted(() => {
  void iniciar()
  window.addEventListener('online', actualizarConexion)
  window.addEventListener('offline', actualizarConexion)
})

onUnmounted(() => {
  window.removeEventListener('online', actualizarConexion)
  window.removeEventListener('offline', actualizarConexion)
})
</script>

<template>
  <div
    v-if="!enLinea"
    role="status"
    aria-live="polite"
    class="fixed inset-x-0 top-0 z-[70] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white"
  >
    Sin conexión. Algunas acciones pueden esperar hasta recuperar internet.
  </div>
  <RouterView />
</template>