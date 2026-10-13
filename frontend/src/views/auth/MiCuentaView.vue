<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import Divider from 'primevue/divider'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
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

const iniciales = computed(() => {
  const u = usuario.value
  if (!u) return 'CA'
  return `${u.nombres?.[0] ?? ''}${u.apellidos?.[0] ?? ''}`.toUpperCase()
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
      <Toast />

      <!-- Header con avatar y rol -->
      <div class="w-full max-w-lg mb-6">
        <Card class="bg-gradient-to-r from-pacific to-pacific/80 text-white">
          <template #content>
            <div class="flex items-center gap-4">
              <Avatar size="xlarge" :label="iniciales" class="bg-white/20 border-2 border-white/30" />
              <div class="flex-1">
                <h1 class="text-2xl font-bold">{{ usuario?.nombres }} {{ usuario?.apellidos }}</h1>
                <p class="text-white/90">{{ usuario?.email }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <Badge :value="rolLabel" severity="info" size="large" />
                  <span class="text-white/70 text-sm">Cuenta verificada</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="w-full max-w-lg space-y-5">
        <!-- Datos personales -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-pacific" />
              <span>Datos personales</span>
            </div>
          </template>
          <template #content>
            <form class="space-y-4" @submit.prevent="onGuardar">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <Label for="nombres">Nombres</Label>
                  <InputText id="nombres" v-model="nombres" type="text" />
                </div>
                <div class="flex flex-col gap-2">
                  <Label for="apellidos">Apellidos</Label>
                  <InputText id="apellidos" v-model="apellidos" type="text" />
                </div>
              </div>
              <Button severity="warn" class="w-full" :loading="cargando" type="submit">
                Guardar cambios
              </Button>
            </form>
          </template>
        </Card>

        <!-- Contacto -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-phone text-pacific" />
              <span>Contacto</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="flex flex-col gap-2">
                <Label for="email">Correo electrónico</Label>
                <InputText id="email" :model-value="usuario?.email" type="email" disabled />
                <p class="text-xs text-muted">El correo no se puede modificar desde aquí.</p>
              </div>
              <div class="flex flex-col gap-2">
                <Label for="telefono">Teléfono</Label>
                <InputText id="telefono" v-model="telefono" type="tel" placeholder="0999 999 999" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Información de cuenta -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-id-card text-pacific" />
              <span>Tipo de cuenta</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <Label for="rol">Rol</Label>
              <div class="flex items-center gap-3">
                <InputText id="rol" :model-value="rolLabel" disabled class="flex-1" />
                <Badge :value="rolLabel" :severity="usuario?.rol === 'tecnico' ? 'success' : usuario?.rol === 'admin' ? 'danger' : 'info'" size="large" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Perfil técnico (solo técnicos) -->
        <Card v-if="usuario?.rol === 'tecnico'" class="border-pacific/20 bg-pacific/5">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-briefcase text-pacific" />
              <span>Perfil de técnico</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <p class="text-sm text-muted">Completa tu perfil público, disponibilidad, certificaciones y tarifas.</p>
              <Divider />
              <div class="grid grid-cols-2 gap-3">
                <Button label="Perfil público" icon="pi pi-user-edit" severity="secondary" class="w-full" @click="router.push('/perfil')" />
                <Button label="Disponibilidad" icon="pi pi-calendar-clock" severity="secondary" class="w-full" @click="router.push('/disponibilidad')" />
                <Button label="Certificaciones" icon="pi pi-id-card" severity="secondary" class="w-full" @click="router.push('/certificaciones')" />
                <Button label="Tarifas" icon="pi pi-dollar" severity="secondary" class="w-full" @click="router.push('/perfil#tarifas')" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Acciones rápidas -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-pacific" />
              <span>Acciones rápidas</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-wrap gap-3">
              <Button label="Mis solicitudes" icon="pi pi-list-check" severity="secondary" class="w-full sm:w-auto" @click="router.push('/solicitudes')" />
              <Button label="Mis direcciones" icon="pi pi-map-marker" severity="secondary" class="w-full sm:w-auto" @click="router.push('/direcciones')" />
              <Button label="Cambiar contraseña" icon="pi pi-lock" severity="secondary" class="w-full sm:w-auto" @click="router.push('/recuperar')" />
            </div>
          </template>
        </Card>
      </div>
    </section>
  </div>
</template>