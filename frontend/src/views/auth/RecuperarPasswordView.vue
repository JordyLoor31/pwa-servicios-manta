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
const { cargando, solicitarRecuperacion } = useAuth()

const email = ref('')

async function onEnviar() {
  await solicitarRecuperacion(email.value)
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-sm">
      <template #title>¿Olvidaste tu contraseña?</template>
      <template #subtitle>Te enviaremos un enlace para restablecerla.</template>
      <template #content>
        <form class="mt-3 space-y-6" @submit.prevent="onEnviar">
          <div class="flex flex-col gap-2">
            <Label for="email">Correo electrónico</Label>
            <InputText id="email" v-model="email" type="email" required />
          </div>
          <Button severity="warn" class="w-full" :loading="cargando" type="submit">Enviar enlace</Button>
        </form>
      </template>
      <template #footer>
        <div class="text-center text-sm text-muted">
          ¿Recordaste tu contraseña?
          <Button variant="link" class="p-0" @click="goToLogin">Volver al inicio de sesión</Button>
        </div>
      </template>
    </Card>
  </div>
</template>