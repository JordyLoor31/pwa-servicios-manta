<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import AppHeader from '../../components/layout/AppHeader.vue'
import HomeBenefits from '../../components/home/HomeBenefits.vue'
import HomeCategoryGrid from '../../components/home/HomeCategoryGrid.vue'
import HomeDownloadSection from '../../components/home/HomeDownloadSection.vue'
import HomeHero from '../../components/home/HomeHero.vue'
import HomeHowItWorks from '../../components/home/HomeHowItWorks.vue'
import NuevaSolicitudDialog from '../../components/solicitudes/NuevaSolicitudDialog.vue'
import { useAuthz } from '../../composables/auth/useAuthz'
import { necesitaOnboarding } from '../../composables/auth/useOnboarding'
import type { Solicitud } from '../../types/solicitudes'

const { usuario } = useAuthz()
const router = useRouter()
const nuevaSolicitudVisible = ref(false)
const configuracionPendiente = ref(false)
const avisoSolicitudVisible = ref(false)

const esCliente = () => usuario.value?.rol === 'cliente'

async function revisarConfiguracion() {
  if (!usuario.value || usuario.value.rol === 'admin') return
  configuracionPendiente.value = await necesitaOnboarding(usuario.value)
}

function abrirSolicitud() {
  if (configuracionPendiente.value) {
    avisoSolicitudVisible.value = true
    return
  }
  nuevaSolicitudVisible.value = true
}

function irAConfiguracion() {
  avisoSolicitudVisible.value = false
  void router.push(esCliente() ? '/direcciones' : '/configuracion-inicial')
}

function explorarCategorias() {
  void nextTick(() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' }))
}

function onSolicitudCreada(creada: Solicitud) {
  void router.push({ name: 'solicitud-detalle', params: { id: creada.id } })
}

onMounted(() => {
  void revisarConfiguracion()
})
</script>

<template>
  <div class="system-page flex min-h-screen flex-col">
    <AppHeader />

    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-12 sm:px-6 sm:py-10 lg:px-8">
      <Message
        v-if="configuracionPendiente"
        severity="warn"
        :closable="false"
        class="mx-auto w-full max-w-4xl"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-semibold">
              {{ esCliente() ? 'Antes de crear una solicitud' : 'Completa tu configuración' }}
            </p>
            <p class="mt-1 text-sm">
              {{
                esCliente()
                  ? 'Guarda una dirección en Mis direcciones para indicar dónde necesitas el servicio.'
                  : 'Agrega tu dirección, perfil, servicios, tarifas y disponibilidad para recibir trabajos.'
              }}
            </p>
          </div>
          <Button
            :label="esCliente() ? 'Ir a Mis direcciones' : 'Completar configuración'"
            icon="pi pi-arrow-right"
            size="small"
            @click="irAConfiguracion"
          />
        </div>
      </Message>
      <HomeHero
        :nombre="`${usuario?.nombres ?? ''} ${usuario?.apellidos ?? ''}`.trim()"
        :rol="usuario?.rol"
        @solicitar="abrirSolicitud"
        @explorar="explorarCategorias"
        @iniciar-sesion="router.push('/login')"
        @registrarse="router.push('/registro')"
      />
      <HomeBenefits />
      <HomeCategoryGrid />
      <HomeHowItWorks />
      <HomeDownloadSection />
    </main>

    <NuevaSolicitudDialog
      v-if="usuario?.rol === 'cliente'"
      v-model:visible="nuevaSolicitudVisible"
      @creada="onSolicitudCreada"
    />

    <Dialog
      v-model:visible="avisoSolicitudVisible"
      modal
      header="Antes de crear una solicitud"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-3 text-sm text-ink">
        <p>
          Para solicitar un servicio primero necesitas completar tu configuración.
        </p>
        <ul class="list-disc space-y-1 pl-5 text-muted">
          <li>Guarda la dirección donde necesitas el servicio.</li>
          <li>Al crear la solicitud, elige categoría, fecha, hora y describe lo que necesitas.</li>
          <li>La dirección permite al técnico ubicarte y calcular la distancia.</li>
        </ul>
      </div>
      <template #footer>
        <Button label="Ahora no" severity="secondary" @click="avisoSolicitudVisible = false" />
        <Button
          :label="esCliente() ? 'Ir a Mis direcciones' : 'Completar configuración'"
          :icon="esCliente() ? 'pi pi-map-marker' : 'pi pi-arrow-right'"
          @click="irAConfiguracion"
        />
      </template>
    </Dialog>
  </div>
</template>
