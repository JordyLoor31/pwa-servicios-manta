<script setup lang="ts">
/// <reference types="vite-plugin-pwa/client" />
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const hayNuevaVersion = ref(false)
const ocultado = ref(false)
const actualizando = ref(false)

let actualizarServiceWorker: (recargar?: boolean) => Promise<void> | undefined

if (import.meta.env.PROD) {
  const registro = registerSW({
    immediate: true,
    onNeedRefresh() {
      hayNuevaVersion.value = true
    },
  })
  actualizarServiceWorker = registro
}

function actualizar() {
  if (!actualizarServiceWorker) return
  actualizando.value = true
  void actualizarServiceWorker(true)
}
</script>

<template>
  <div
    v-if="hayNuevaVersion && !ocultado"
    class="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 shadow-lg"
  >
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-gray-800">Nueva versión disponible</p>
      <p class="truncate text-xs text-gray-500">Toca «Actualizar» para aplicar los cambios.</p>
    </div>
    <button
      type="button"
      class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      :disabled="actualizando"
      @click="actualizar"
    >
      {{ actualizando ? 'Actualizando…' : 'Actualizar' }}
    </button>
    <button
      type="button"
      aria-label="Cerrar aviso"
      class="text-gray-400 hover:text-gray-600"
      @click="ocultado = true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>