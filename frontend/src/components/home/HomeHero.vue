<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { RolUsuario } from '../../composables/auth/useAuthz'

defineProps<{
  nombre: string
  rol: RolUsuario | undefined
}>()

const emit = defineEmits<{
  solicitar: []
  explorar: []
  iniciarSesion: []
  registrarse: []
}>()
</script>

<template>
  <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#063b68] via-pacific to-[#008ea8] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-12">
    <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
    <div class="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
    <div class="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <Tag value="Servicios confiables en Manta" icon="pi pi-map-marker" severity="warn" class="mb-5" />
        <p class="text-sm font-medium text-cyan-100">{{ nombre ? `Hola, ${nombre}` : 'Bienvenido a CamelloApp' }}</p>
        <h1 class="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Soluciones para tu hogar, <span class="text-amber-300">a tu manera.</span>
        </h1>
        <p class="mt-4 max-w-xl text-sm leading-7 text-cyan-50 sm:text-base">
          Conecta con técnicos locales verificados, compara propuestas y elige con tranquilidad
          quién atenderá tu servicio.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <Button
            v-if="rol === 'cliente'"
            label="Solicitar un servicio"
            icon="pi pi-arrow-right"
            icon-pos="right"
            severity="warn"
            @click="emit('solicitar')"
          />
          <template v-else-if="!rol">
            <Button label="Iniciar sesión" icon="pi pi-sign-in" severity="warn" @click="emit('iniciarSesion')" />
            <Button label="Crear cuenta" icon="pi pi-user-plus" outlined severity="secondary" class="!border-white/50 !text-white hover:!bg-white/10" @click="emit('registrarse')" />
          </template>
          <Button
            label="Explorar categorías"
            icon="pi pi-th-large"
            outlined
            severity="secondary"
            class="!border-white/50 !text-white hover:!bg-white/10"
            @click="emit('explorar')"
          />
        </div>
      </div>
      <div class="hidden justify-center lg:flex">
        <div class="relative">
          <div class="absolute inset-5 rounded-full bg-white/10 blur-2xl" />
          <img src="../../assets/camelloapp.png" alt="CamelloApp conecta clientes y técnicos en Manta" class="relative h-72 w-72 object-contain drop-shadow-2xl" />
        </div>
      </div>
    </div>
  </section>
</template>
