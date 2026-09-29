<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Toast from 'primevue/toast'
import { useAuth } from '../../composables/auth/useAuth'

const route = useRoute()
const { cargando, restablecerContrasena } = useAuth()

const password = ref('')
const confirmacion = ref('')

const token = ref(typeof route.query.token === 'string' ? route.query.token : '')

async function onRestablecer() {
  if (password.value !== confirmacion.value) {
    return
  }
  if (!token.value) return
  await restablecerContrasena(token.value, password.value)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-sm">
      <template #title>Nueva contraseña</template>
      <template #subtitle>Elige una contraseña nueva para tu cuenta.</template>
      <template #content>
        <form class="mt-3 space-y-6" @submit.prevent="onRestablecer">
          <div class="flex flex-col gap-2">
            <Label for="password">Nueva contraseña</Label>
            <InputText id="password" v-model="password" type="password" required minlength="8" />
            <small class="text-muted">Mínimo 8 caracteres.</small>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="confirmacion">Confirmar contraseña</Label>
            <InputText id="confirmacion" v-model="confirmacion" type="password" required minlength="8" />
            <small v-if="confirmacion && password !== confirmacion" class="text-red-600">
              Las contraseñas no coinciden.
            </small>
          </div>
          <Button severity="warn" class="w-full" :loading="cargando" type="submit">
            Restablecer contraseña
          </Button>
        </form>
      </template>
      <template #footer>
        <div v-if="!token" class="text-center text-sm text-muted">
          El enlace de recuperación no es válido o está incompleto.
        </div>
      </template>
    </Card>
  </div>
</template>