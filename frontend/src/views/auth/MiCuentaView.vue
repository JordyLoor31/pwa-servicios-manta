<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import AppProgressSpinner from '../../components/layout/AppProgressSpinner.vue'
import { useRouter } from 'vue-router'
import { useAuthz } from '../../composables/auth/useAuthz'
import { useAuth } from '../../composables/auth/useAuth'

const { usuario } = useAuthz()
const { cargando, actualizarMisDatos } = useAuth()
const router = useRouter()

const nombres = ref(usuario.value?.nombres ?? '')
const apellidos = ref(usuario.value?.apellidos ?? '')
const telefono = ref(
  typeof usuario.value?.telefono === 'string' && usuario.value.telefono ? usuario.value.telefono : '',
)

const rolLabel = computed(() => {
  switch (usuario.value?.rol) {
    case 'tecnico':
      return 'Técnico'
    case 'admin':
      return 'Administrador'
    default:
      return 'Cliente'
  }
})

async function onGuardar() {
  await actualizarMisDatos({
    nombres: nombres.value || undefined,
    apellidos: apellidos.value || undefined,
    telefono: telefono.value || undefined,
  })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <div v-if="cargando" class="fixed inset-0 z-[60] flex items-center justify-center bg-white/80">
      <AppProgressSpinner />
    </div>
    <section class="mx-auto flex w-full max-w-5xl flex-1 items-start justify-center px-4 py-8">
      <Card class="w-full max-w-lg">
      <template #title>Mi cuenta</template>
      <template #subtitle>Completa o actualiza tus datos personales.</template>
      <template #content>
        <Toast />
        <form class="mt-3 space-y-4" @submit.prevent="onGuardar">
          <div class="flex flex-col gap-2">
            <Label for="nombres">Nombres</Label>
            <InputText id="nombres" v-model="nombres" type="text" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="apellidos">Apellidos</Label>
            <InputText id="apellidos" v-model="apellidos" type="text" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="email">Correo electrónico</Label>
            <InputText id="email" :model-value="usuario?.email" type="email" disabled />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="telefono">Teléfono</Label>
            <InputText id="telefono" v-model="telefono" type="tel" placeholder="0999 999 999" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="rol">Tipo de cuenta</Label>
            <InputText id="rol" :model-value="rolLabel" disabled />
          </div>
          <Button severity="warn" class="mt-2 w-full" :loading="cargando" type="submit">
            Guardar cambios
          </Button>
        </form>

        <div v-if="usuario?.rol === 'tecnico'" class="mt-6 rounded-lg border border-pacific/10 bg-pacific/5 p-4">
          <p class="text-sm font-semibold text-ink">Perfil de técnico</p>
          <p class="mt-1 text-xs text-muted">Completa o actualiza tu perfil público, disponibilidad y certificaciones.</p>
          <Button severity="secondary" class="mt-3 w-full" @click="router.push('/perfil')">
            Ir a mi perfil de técnico
          </Button>
        </div>
      </template>
    </Card>
    </section>
  </div>
</template>
