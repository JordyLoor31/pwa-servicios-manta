<script setup lang="ts">
import AppHeader from '../../components/layout/AppHeader.vue'
import { useAuthz } from '../../composables/auth/useAuthz'

const { usuario } = useAuthz()

const accesos = [
  {
    titulo: 'Solicitar un servicio',
    descripcion: 'Describe lo que necesitas y recibe propuestas de técnicos verificados.',
    icono: 'pi pi-send',
  },
  {
    titulo: 'Seguir mis solicitudes',
    descripcion: 'Consulta el estado de tus solicitudes y la respuesta de cada técnico.',
    icono: 'pi pi-list-check',
  },
  {
    titulo: 'Perfil técnico',
    descripcion: 'Verificación, categorías, disponibilidad y calificaciones de tu perfil.',
    icono: 'pi pi-id-card',
  },
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <section
        class="rounded-2xl bg-gradient-to-br from-pacific to-pacific-800 p-6 text-white shadow-lg sm:p-10"
      >
        <p class="text-sm font-medium text-pacific-100">Bienvenido de nuevo</p>
        <h1 class="mt-1 text-2xl font-semibold sm:text-3xl">
          Hola, {{ usuario?.nombres }} {{ usuario?.apellidos }}
        </h1>
        <p class="mt-3 max-w-xl text-sm leading-relaxed text-pacific-100 sm:text-base">
          Gestiona tus servicios técnicos en Manta desde un solo lugar: solicita, cotiza y
          contrata al técnico ideal para cada necesidad.
        </p>
      </section>

      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="acceso in accesos"
          :key="acceso.titulo"
          class="flex items-start gap-4 rounded-xl border border-pacific/10 bg-card p-5 shadow-sm"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-turquoise-50 text-lg text-turquoise-600"
          >
            <i :class="acceso.icono" />
          </div>
          <div>
            <h3 class="font-semibold text-ink">{{ acceso.titulo }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-muted">{{ acceso.descripcion }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>