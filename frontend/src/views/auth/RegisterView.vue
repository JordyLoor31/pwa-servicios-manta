<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { useAuth } from '../../composables/auth/useAuth'
import type { RolUsuario } from '../../composables/auth/useAuthz'

const router = useRouter()
const { cargando, registro } = useAuth()

const nombres = ref('')
const apellidos = ref('')
const email = ref('')
const password = ref('')
const telefono = ref('')
const rol = ref<RolUsuario>('cliente')

const roles = [
  { label: 'Cliente', value: 'cliente' },
  { label: 'Técnico', value: 'tecnico' },
]

function onRegister() {
  registro({
    nombres: nombres.value,
    apellidos: apellidos.value,
    email: email.value,
    password: password.value,
    telefono: telefono.value || undefined,
    rol: rol.value,
  })
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-md">
      <template #title>Crea tu cuenta</template>
      <template #subtitle>Únete a Servicios Manta para empezar.</template>
      <template #content>
        <form class="mt-3 space-y-4" @submit.prevent="onRegister">
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
            <InputText id="email" v-model="email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="password">Contraseña</Label>
            <InputText id="password" v-model="password" type="password" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="telefono">Teléfono</Label>
            <InputText id="telefono" v-model="telefono" type="tel" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="rol">Tipo de cuenta</Label>
            <Select id="rol" v-model="rol" :options="roles" option-label="label" option-value="value" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button severity="warn" class="w-full" :loading="cargando" @click="onRegister">Crear cuenta</Button>
          <div class="mt-2 text-center text-sm text-muted">
            ¿Ya tienes cuenta?
            <Button variant="link" class="p-0" @click="goToLogin">Inicia sesión</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>