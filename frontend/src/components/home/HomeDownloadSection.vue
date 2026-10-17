<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { usePWAInstall } from '../../composables/usePWAInstall'

const { canInstall, promptInstall } = usePWAInstall()
const visible = ref(false)

async function instalar() {
  if (canInstall) {
    await promptInstall()
    return
  }
  visible.value = true
}
</script>

<template>
  <section class="grid gap-6 overflow-hidden rounded-3xl border border-pacific/10 bg-gradient-to-r from-card to-pacific/5 p-6 shadow-sm sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
    <div>
      <div class="mb-3 flex items-center gap-2 text-pacific"><i class="pi pi-mobile text-xl" /><span class="text-sm font-semibold uppercase tracking-wider">Llévala contigo</span></div>
      <h2 class="text-2xl font-bold text-ink sm:text-3xl">CamelloApp, siempre a tu alcance</h2>
      <p class="mt-2 max-w-xl text-sm leading-6 text-muted">Instala la aplicación en Android o iOS para solicitar servicios y recibir actualizaciones en tiempo real.</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <Button label="Android" icon="pi pi-android" severity="success" @click="instalar" />
      <Button label="iPhone / iPad" icon="pi pi-apple" outlined severity="secondary" @click="visible = true" />
    </div>
    <Dialog v-model:visible="visible" modal header="Instalar CamelloApp" :style="{ width: 'min(28rem, calc(100vw - 2rem))' }">
      <div class="space-y-3 text-sm leading-6 text-muted">
        <p><strong class="text-ink">Android:</strong> usa el botón de instalación del navegador o selecciona “Añadir a pantalla de inicio”.</p>
        <p><strong class="text-ink">iPhone y iPad:</strong> toca Compartir en Safari y elige “Añadir a pantalla de inicio”.</p>
        <Button v-if="canInstall" label="Instalar ahora" icon="pi pi-download" class="mt-2 w-full" @click="instalar" />
      </div>
    </Dialog>
  </section>
</template>
