<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import { api } from '../services/api'

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
    rol: string
  }
}

async function onLogin() {
  cargando.value = true
  try {
    const data = await api.post<LoginResponse>('/auth/login', {
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
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
  <div class="min-h-screen flex items-center justify-center p-4">
    <Toast />
    <Card class="max-w-sm w-full">
      <template #title>Welcome back</template>
      <template #subtitle>Sign in with your email to continue.</template>
      <template #content>
        <form class="space-y-6 mt-3" @submit.prevent="onLogin">
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
          <Button class="w-full" :loading="cargando" @click="onLogin">Login</Button>
          <Button severity="secondary" variant="outlined" class="w-full">Login with Google</Button>
          <div class="mt-2 text-center text-gray-500 text-sm">
            Don't have an account?
            <Button variant="link" class="p-0" @click="goToRegister">Sign up</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>