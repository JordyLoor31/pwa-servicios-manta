<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import { useAuthz } from '../../composables/auth/useAuthz'
import { useAuth } from '../../composables/auth/useAuth'

const { usuario } = useAuthz()
const { cargando, actualizarMisDatos } = useAuth()

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
  <div class="flex min-h-screen items-start justify-center p-4">
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
      </template>
    </Card>
  </div>
</template>