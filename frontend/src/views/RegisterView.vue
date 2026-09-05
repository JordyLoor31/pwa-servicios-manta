<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { api } from '../services/api'

const router = useRouter()
const toast = useToast()
const cargando = ref(false)

const nombres = ref('')
const apellidos = ref('')
const email = ref('')
const password = ref('')
const telefono = ref('')
const rol = ref('cliente')

const roles = [
  { label: 'Cliente', value: 'cliente' },
  { label: 'Técnico', value: 'tecnico' },
]

async function onRegister() {
  cargando.value = true
  try {
    await api.post('/usuarios', {
      nombres: nombres.value,
      apellidos: apellidos.value,
      email: email.value,
      password: password.value,
      telefono: telefono.value || undefined,
      rol: rol.value,
    })
    toast.add({
      severity: 'success',
      summary: 'Cuenta creada',
      detail: 'Ya puedes iniciar sesión.',
      life: 3000,
    })
    router.push('/login')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo crear la cuenta',
      life: 4000,
    })
  } finally {
    cargando.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Toast />
    <Card class="max-w-md w-full">
      <template #title>Create your account</template>
      <template #subtitle>Join Manta Servicios to get started.</template>
      <template #content>
        <form class="space-y-4 mt-3" @submit.prevent="onRegister">
          <div class="flex flex-col gap-2">
            <Label for="nombres">Nombres</Label>
            <InputText id="nombres" v-model="nombres" type="text" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="apellidos">Apellidos</Label>
            <InputText id="apellidos" v-model="apellidos" type="text" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <InputText id="email" v-model="email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="password">Password</Label>
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
          <Button class="w-full" :loading="cargando" @click="onRegister">Create account</Button>
          <div class="mt-2 text-center text-gray-500 text-sm">
            Already have an account?
            <Button variant="link" class="p-0" @click="goToLogin">Sign in</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>