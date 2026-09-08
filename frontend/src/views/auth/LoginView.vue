<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import { useAuth } from '../../composables/auth/useAuth'

const router = useRouter()
const { cargando, login } = useAuth()

const email = ref('')
const password = ref('')

function onLogin() {
  login(email.value, password.value)
}

function goToRegister() {
  router.push('/registro')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-sm">
      <template #title>Bienvenido de nuevo</template>
      <template #subtitle>Inicia sesión con tu correo para continuar.</template>
      <template #content>
        <form class="mt-3 space-y-6" @submit.prevent="onLogin">
          <div class="flex flex-col gap-2">
            <Label for="email">Correo electrónico</Label>
            <InputText id="email" v-model="email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="flex-1">Contraseña</Label>
              <Button variant="link" class="p-0">¿Olvidaste tu contraseña?</Button>
            </div>
            <InputText id="password" v-model="password" type="password" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button severity="warn" class="w-full" :loading="cargando" @click="onLogin">Iniciar sesión</Button>
          <div class="mt-2 text-center text-sm text-muted">
            ¿No tienes cuenta?
            <Button variant="link" class="p-0" @click="goToRegister">Regístrate</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>