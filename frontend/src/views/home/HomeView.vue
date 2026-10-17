<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../../components/layout/AppHeader.vue'
import HomeBenefits from '../../components/home/HomeBenefits.vue'
import HomeCategoryGrid from '../../components/home/HomeCategoryGrid.vue'
import HomeDownloadSection from '../../components/home/HomeDownloadSection.vue'
import HomeHero from '../../components/home/HomeHero.vue'
import HomeHowItWorks from '../../components/home/HomeHowItWorks.vue'
import NuevaSolicitudDialog from '../../components/solicitudes/NuevaSolicitudDialog.vue'
import { useAuthz } from '../../composables/auth/useAuthz'

const { usuario } = useAuthz()
const router = useRouter()
const nuevaSolicitudVisible = ref(false)

function explorarCategorias() {
  void nextTick(() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' }))
}
</script>

<template>
  <div class="system-page flex min-h-screen flex-col">
    <AppHeader />

    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-12 sm:px-6 sm:py-10 lg:px-8">
      <HomeHero
        :nombre="`${usuario?.nombres ?? ''} ${usuario?.apellidos ?? ''}`.trim()"
        :rol="usuario?.rol"
        @solicitar="nuevaSolicitudVisible = true"
        @explorar="explorarCategorias"
        @iniciar-sesion="router.push('/login')"
        @registrarse="router.push('/registro')"
      />
      <HomeBenefits />
      <HomeCategoryGrid />
      <HomeHowItWorks />
      <HomeDownloadSection />
    </main>

    <NuevaSolicitudDialog v-if="usuario?.rol === 'cliente'" v-model:visible="nuevaSolicitudVisible" />
  </div>
</template>
