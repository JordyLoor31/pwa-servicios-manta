<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import { api } from '../../services/api'
import { iniciarSesion } from '../../composables/useAuthz'

const router = useRouter()
const toast = useToast()
const cargando = ref(false)
const email = ref('')
const password = ref('')

interface LoginResponse {
  access_token: string
  user: {
    id: string
    nombres: string
    apellidos: string
    email: string
    rol: import('../../composables/useAuthz').RolUsuario
  }
}

async function onLogin() {
  cargando.value = true
  try {
    const data = await api.post<LoginResponse>('/auth/login', {
      email: email.value,
      password: password.value,
    })
    iniciarSesion(data.access_token, data.user)
    router.push('/')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo iniciar sesión',
      life: 4000,
    })
  } finally {
    cargando.value = false
  }
}

function goToRegister() {
  router.push('/registro')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-sm">
      <template #title>Welcome back</template>
      <template #subtitle>Sign in with your email to continue.</template>
      <template #content>
        <form class="mt-3 space-y-6" @submit.prevent="onLogin">
          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <InputText id="email" v-model="email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="flex-1">Password</Label>
              <Button variant="link" class="p-0">Forgot password?</Button>
            </div>
            <InputText id="password" v-model="password" type="password" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button severity="warn" class="w-full" :loading="cargando" @click="onLogin">Login</Button>
          <div class="mt-2 text-center text-sm text-muted">
            Don't have an account?
            <Button variant="link" class="p-0" @click="goToRegister">Sign up</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>