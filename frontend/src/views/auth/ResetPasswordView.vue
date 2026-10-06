<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useAuth } from '../../composables/auth/useAuth'
import AppProgressSpinner from '../../components/layout/AppProgressSpinner.vue'
import PasswordInput from '../../components/auth/PasswordInput.vue'

const route = useRoute()
const router = useRouter()
const {
  cargando,
  restablecerContrasena,
  validarTokenRestablecer,
} = useAuth()

type Estado = 'cargando' | 'valido' | 'expirado' | 'invalido'

const estado = ref<Estado>('cargando')
const motivo = ref<'expirado' | 'invalido'>('expirado')
const password = ref('')
const confirmacion = ref('')
const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const expiracionTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function marcarExpirado() {
  estado.value = 'expirado'
  motivo.value = 'expirado'
}

async function verificarEnlace() {
  if (!token.value) {
    estado.value = 'invalido'
    motivo.value = 'invalido'
    return
  }
  const resultado = await validarTokenRestablecer(token.value)
  if (resultado.valido) {
    estado.value = 'valido'
    expiracionTimer.value = setTimeout(marcarExpirado, 5 * 60 * 1000)
  } else {
    estado.value = resultado.motivo === 'expirado' ? 'expirado' : 'invalido'
    motivo.value = resultado.motivo ?? 'invalido'
  }
}

async function onRestablecer() {
  if (password.value !== confirmacion.value || !token.value) return
  const ok = await restablecerContrasena(token.value, password.value)
  if (!ok) {
    marcarExpirado()
  }
}

onMounted(verificarEnlace)
onUnmounted(() => {
  if (expiracionTimer.value) clearTimeout(expiracionTimer.value)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <Card class="w-full max-w-sm">
      <template #content>
        <div v-if="estado === 'cargando'" class="flex flex-col items-center gap-3 py-8">
          <AppProgressSpinner />
          <p class="text-sm text-muted">Verificando el enlace…</p>
        </div>

        <div v-else-if="estado === 'valido'" class="flex flex-col">
          <div class="flex flex-col items-center gap-3">
            <img src="/faviconcamello.png" alt="CamelloApp" class="h-16 w-16 rounded-2xl" />
            <h2 class="text-xl font-semibold">Nueva contraseña</h2>
            <p class="text-sm text-muted">Elige una contraseña nueva para tu cuenta.</p>
          </div>
          <form class="mt-5 space-y-6" @submit.prevent="onRestablecer">
            <PasswordInput id="password" v-model="password" label="Nueva contraseña" autocomplete="new-password" :show-rules="true" />
            <PasswordInput id="confirmacion" v-model="confirmacion" label="Confirmar contraseña" autocomplete="new-password" :show-rules="true" />
            <small v-if="confirmacion && password !== confirmacion" class="text-red-600 block">
              Las contraseñas no coinciden.
            </small>
            <Button severity="warn" class="w-full" :loading="cargando" type="submit">
              Restablecer contraseña
            </Button>
          </form>
        </div>

        <div v-else class="flex flex-col items-center gap-4 py-4 text-center">
          <img src="/faviconcamello.png" alt="CamelloApp" class="h-20 w-20 rounded-2xl" />
          <div>
            <h2 class="text-xl font-semibold text-gray-800">
              {{ motivo === 'expirado' ? 'Enlace expirado' : 'Enlace no válido' }}
            </h2>
            <p class="mt-2 text-sm text-muted">
              {{
                motivo === 'expirado'
                  ? 'Este enlace de recuperación ya expiró (es válido solo por 5 minutos). Solicita uno nuevo para restablecer tu contraseña.'
                  : 'Este enlace fue utilizado o no corresponde a ninguna solicitud de recuperación.'
              }}
            </p>
          </div>
          <div class="flex w-full flex-col gap-3">
            <Button severity="warn" class="w-full" icon="pi pi-envelope" @click="router.push('/recuperar')">
              Solicitar otro enlace
            </Button>
            <Button severity="secondary" text class="w-full" @click="router.push('/login')">
              Volver al inicio de sesión
            </Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>