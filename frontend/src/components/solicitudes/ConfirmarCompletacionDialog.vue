<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputOtp from 'primevue/inputotp'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useSolicitudes } from '../../composables/solicitudes/useSolicitudes'

interface Props {
  visible: boolean
  solicitudId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'confirmado'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToast()
const { iniciarCompletacion, confirmarCompletacion, cargando } = useSolicitudes()

const codigo = ref('')
const expiracion = ref<string | null>(null)
const timer = ref<ReturnType<typeof setInterval> | null>(null)
const tiempoRestante = ref(0)
const paso = ref<'esperando' | 'codigo-enviado' | 'verificando'>('esperando')
const errorCodigo = ref('')

async function onAbrir() {
  paso.value = 'esperando'
  codigo.value = ''
  expiracion.value = null
  errorCodigo.value = ''
  if (timer.value) clearInterval(timer.value)
}

async function onIniciarCompletacion() {
  try {
    const res = await iniciarCompletacion(props.solicitudId)
    expiracion.value = res.expiracion
    paso.value = 'codigo-enviado'
    iniciarTemporizador(new Date(res.expiracion))
    toast.add({ severity: 'info', summary: 'Código enviado', detail: 'El cliente recibió el código de 4 dígitos.', life: 5000 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al iniciar completación'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
  }
}

function iniciarTemporizador(fechaExpiracion: Date) {
  if (timer.value) clearInterval(timer.value)
  const actualizar = () => {
    const diff = Math.max(0, Math.ceil((fechaExpiracion.getTime() - Date.now()) / 1000))
    tiempoRestante.value = diff
    if (diff === 0) {
      clearInterval(timer.value!)
      paso.value = 'esperando'
      toast.add({ severity: 'warn', summary: 'Código expirado', detail: 'El código ha expirado. Intenta de nuevo.', life: 5000 })
    }
  }
  actualizar()
  timer.value = setInterval(actualizar, 1000)
}

function formatearTiempo(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function validarCodigo(): boolean {
  if (codigo.value.length !== 4) {
    errorCodigo.value = 'El código debe tener 4 dígitos'
    return false
  }
  errorCodigo.value = ''
  return true
}

async function onConfirmar() {
  if (!validarCodigo()) return
  try {
    paso.value = 'verificando'
    await confirmarCompletacion(props.solicitudId, codigo.value)
    toast.add({ severity: 'success', summary: 'Confirmado', detail: 'El servicio se ha completado correctamente.', life: 5000 })
    if (timer.value) clearInterval(timer.value)
    emit('confirmado')
    emit('close')
  } catch (error: unknown) {
    paso.value = 'codigo-enviado'
    const message = error instanceof Error ? error.message : 'Error al confirmar'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
  }
}

watch(() => props.visible, (val) => {
  if (val) onAbrir()
  else {
    if (timer.value) clearInterval(timer.value)
  }
})
</script>

<template>
  <Teleport to="body">
    <Dialog :visible="visible" @hide="emit('close')" header="Confirmar completación" :modal="true" :style="{ width: '24rem' }">
      <div class="flex flex-col gap-4">
        <div v-if="paso === 'esperando'" class="text-center">
          <p class="text-muted mb-4">Al presionar "Finalizar trabajo", se generará un código de 4 dígitos que se enviará al cliente.</p>
          <p class="text-muted mb-4">Pide al cliente el código y escríbelo para confirmar la completación.</p>
          <Button label="Finalizar trabajo" icon="pi pi-check" @click="onIniciarCompletacion" :loading="cargando" severity="warn" class="w-full" />
        </div>

        <div v-else-if="paso === 'codigo-enviado'" class="flex flex-col gap-4">
          <div class="text-center">
            <p class="text-sm text-muted mb-2">Código enviado al cliente. Válido por:</p>
            <div class="text-3xl font-mono font-bold text-pacific mb-4">{{ formatearTiempo(tiempoRestante) }}</div>
            <p class="text-sm text-muted">Ingresa el código de 4 dígitos que te entregó el cliente.</p>
          </div>
          <div class="flex flex-col gap-3">
            <InputOtp v-model="codigo" :length="4" :mask="false" fluid />
            <p v-if="errorCodigo" class="text-red-500 text-sm text-center">{{ errorCodigo }}</p>
            <Button label="Confirmar" icon="pi pi-check" @click="onConfirmar" :loading="cargando" severity="warn" class="w-full" />
          </div>
        </div>

        <div v-else class="text-center py-4">
          <i class="pi pi-spin pi-spinner text-3xl text-pacific"></i>
          <p class="mt-2 text-muted">Verificando código...</p>
        </div>
      </div>
    </Dialog>
  </Teleport>
</template>