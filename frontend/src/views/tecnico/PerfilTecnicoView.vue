<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import StepPanels from 'primevue/steppanels'
import Step from 'primevue/step'
import StepPanel from 'primevue/steppanel'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { api } from '../../services/api'
import { useAuthz } from '../../composables/useAuthz'

interface PerfilTecnico {
  usuario_id: string
  biografia: string | null
  anios_experiencia: number | null
  radio_cobertura_km: number | null
}

const router = useRouter()
const toast = useToast()
const { usuario } = useAuthz()

const activeStep = ref(1)
const cargando = ref(false)

const aniosExperiencia = ref<number | null>(null)
const radioCobertura = ref<number | null>(null)
const biografia = ref('')
const perfilExistente = ref(false)

onMounted(async () => {
  const id = usuario.value?.id
  if (!id) return
  try {
    const perfil = await api.get<PerfilTecnico>(`/perfiles-tecnico/${id}`)
    perfilExistente.value = true
    aniosExperiencia.value = perfil.anios_experiencia
    radioCobertura.value = perfil.radio_cobertura_km
    biografia.value = perfil.biografia ?? ''
  } catch {
    perfilExistente.value = false
  }
})

async function guardarPasoUno(activateCallback: (step: number) => void) {
  const id = usuario.value?.id
  if (!id) return
  cargando.value = true
  try {
    const datos = {
      anios_experiencia: aniosExperiencia.value ?? undefined,
      radio_cobertura_km: radioCobertura.value ?? undefined,
      biografia: biografia.value.trim() || undefined,
    }
    if (perfilExistente.value) {
      await api.put(`/perfiles-tecnico/${id}`, datos)
    } else {
      await api.post('/perfiles-tecnico', { usuario_id: id, ...datos })
    }
    perfilExistente.value = true
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Datos del técnico guardados.', life: 3000 })
    activateCallback(2)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudieron guardar los datos',
      life: 4000,
    })
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />

    <section class="flex flex-1 items-center justify-center p-4">
      <Toast />
      <div class="w-full max-w-3xl">
        <div class="mb-6 flex items-center justify-between gap-3">
          <h1 class="text-2xl font-semibold text-ink">Tu perfil de técnico</h1>
          <Button icon="pi pi-home" label="Inicio" severity="secondary" variant="text" @click="router.push('/')" />
        </div>
        <Stepper v-model:value="activeStep" class="basis-160 min-w-0">
          <StepList>
            <Step v-slot="{ activateCallback, value, a11yAttrs }" asChild :value="1">
              <div class="flex flex-row flex-auto gap-2" v-bind="a11yAttrs.root">
                <button
                  class="inline-flex flex-col gap-2 border-0 bg-transparent"
                  @click="activateCallback"
                  v-bind="a11yAttrs.header"
                >
                  <span
                    :class="[
                      'inline-flex h-12 w-12 items-center justify-center rounded-full border-2',
                      Number(value) <= activeStep ? 'border-pacific bg-pacific text-white' : 'border-ink/20 text-muted',
                    ]"
                  >
                    <i class="pi pi-user" />
                  </span>
                </button>
                <Divider />
              </div>
            </Step>
            <Step v-slot="{ activateCallback, value, a11yAttrs }" asChild :value="2">
              <div class="flex flex-row flex-auto gap-2 pl-2" v-bind="a11yAttrs.root">
                <button
                  class="inline-flex flex-col gap-2 border-0 bg-transparent"
                  @click="activateCallback"
                  v-bind="a11yAttrs.header"
                >
                  <span
                    :class="[
                      'inline-flex h-12 w-12 items-center justify-center rounded-full border-2',
                      Number(value) <= activeStep ? 'border-pacific bg-pacific text-white' : 'border-ink/20 text-muted',
                    ]"
                  >
                    <i class="pi pi-star" />
                  </span>
                </button>
                <Divider />
              </div>
            </Step>
            <Step v-slot="{ activateCallback, value, a11yAttrs }" asChild :value="3">
              <div class="flex flex-row pl-2" v-bind="a11yAttrs.root">
                <button
                  class="inline-flex flex-col gap-2 border-0 bg-transparent"
                  @click="activateCallback"
                  v-bind="a11yAttrs.header"
                >
                  <span
                    :class="[
                      'inline-flex h-12 w-12 items-center justify-center rounded-full border-2',
                      Number(value) <= activeStep ? 'border-pacific bg-pacific text-white' : 'border-ink/20 text-muted',
                    ]"
                  >
                    <i class="pi pi-id-card" />
                  </span>
                </button>
              </div>
            </Step>
          </StepList>

          <StepPanels>
            <StepPanel v-slot="{ activateCallback }" :value="1">
              <div class="mx-auto flex min-h-64 max-w-md flex-col gap-4">
                <div class="mb-2 text-center text-lg font-semibold text-ink">Datos del técnico</div>
                <p class="text-center text-sm text-muted">
                  Cuéntanos tu experiencia y cobertura para publicar tu perfil.
                </p>
                <div class="flex flex-col gap-1.5">
                  <label for="anios" class="text-sm font-semibold text-ink">Años de experiencia</label>
                  <InputNumber id="anios" v-model="aniosExperiencia" :min="0" :max="100" placeholder="Ej. 5" fluid />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="radio" class="text-sm font-semibold text-ink">Radio de cobertura (km)</label>
                  <InputNumber
                    id="radio"
                    v-model="radioCobertura"
                    :min="0"
                    :max="999"
                    :max-fraction-digits="2"
                    placeholder="Ej. 15"
                    fluid
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="biografia" class="text-sm font-semibold text-ink">Biografía</label>
                  <Textarea
                    id="biografia"
                    v-model="biografia"
                    rows="4"
                    placeholder="Describe tu experiencia y especialidad"
                  />
                </div>
              </div>
              <div class="flex justify-end pt-5">
                <Button :loading="cargando" @click="guardarPasoUno(activateCallback)">
                  Guardar y continuar
                  <i class="pi pi-arrow-right ml-2" />
                </Button>
              </div>
            </StepPanel>

            <StepPanel v-slot="{ activateCallback }" :value="2">
              <div class="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-4 text-center">
                <div class="text-lg font-semibold text-ink">Información adicional</div>
                <p class="text-sm leading-relaxed text-muted">
                  Tus categorías de servicio, disponibilidad semanal y certificaciones se gestionarán desde
                  <span class="font-semibold text-ink">Mi perfil</span>.
                </p>
              </div>
              <div class="flex justify-between pt-5">
                <Button severity="secondary" variant="outlined" @click="activateCallback(1)">
                  <i class="pi pi-arrow-left mr-2" />
                  Volver
                </Button>
                <Button @click="activateCallback(3)">
                  Continuar
                  <i class="pi pi-arrow-right ml-2" />
                </Button>
              </div>
            </StepPanel>

            <StepPanel :value="3">
              <div class="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-3 text-center">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-turquoise-50 text-turquoise-600">
                  <i class="pi pi-check text-2xl" />
                </div>
                <div class="text-lg font-semibold text-ink">Todo listo</div>
                <p class="text-sm leading-relaxed text-muted">
                  Tu perfil de técnico quedó registrado. Puedes completar más información desde el menú lateral.
                </p>
              </div>
              <div class="flex justify-end pt-5">
                <Button label="Volver al inicio" @click="router.push('/')">
                  <i class="pi pi-home ml-2" />
                </Button>
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </div>
    </section>
  </div>
</template>