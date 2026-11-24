<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import StepPanels from 'primevue/steppanels'
import Step from 'primevue/step'
import StepPanel from 'primevue/steppanel'
import Button from 'primevue/button'
import Rating from 'primevue/rating'
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import StepperStep from '../../components/stepper/StepperStep.vue'
import DatosStep from '../../components/perfil-tecnico/DatosStep.vue'
import CategoriasTecnicoStep from '../../components/perfil-tecnico/CategoriasTecnicoStep.vue'
import InfoAdicionalStep from '../../components/perfil-tecnico/InfoAdicionalStep.vue'
import ListoStep from '../../components/perfil-tecnico/ListoStep.vue'
import ResenasCarousel from '../../components/perfil-tecnico/ResenasCarousel.vue'
import { usePerfilTecnicoForm } from '../../composables/perfil-tecnico/usePerfilTecnicoForm'
import { useAuthz } from '../../composables/auth/useAuthz'
import { perfilTecnicoApi } from '../../services/perfil-tecnico'
import { ApiError } from '../../services/api'
import type { PerfilPublico } from '../../types/perfil-tecnico'

const router = useRouter()
const { usuario } = useAuthz()
const perfilPublico = ref<PerfilPublico | null>(null)
const cargandoResenas = ref(true)
const sinPerfilPublico = ref(false)
const errorResenas = ref('')

onMounted(async () => {
  const usuarioId = usuario.value?.id
  if (!usuarioId) {
    cargandoResenas.value = false
    return
  }
  try {
    perfilPublico.value = await perfilTecnicoApi.obtenerPerfilPublico(usuarioId)
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      sinPerfilPublico.value = true
    } else {
      errorResenas.value = error instanceof Error ? error.message : 'No se pudieron cargar tus reseñas'
    }
  } finally {
    cargandoResenas.value = false
  }
})

const {
  activeStep,
  cargandoDatos,
  cargandoPerfil,
  errorCargandoPerfil,
  cargandoCatalogo,
  guardandoCategorias,
  aniosExperiencia,
  radioCobertura,
  biografia,
  categorias,
  tarifasPorCategoria,
  categoriasSeleccionadas,
  irAPaso,
  guardarDatos,
  guardarCategorias,
} = usePerfilTecnicoForm()
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
            <Step v-slot="{ value, a11yAttrs }" asChild :value="1">
              <StepperStep
                :value="Number(value)"
                :active-step="activeStep"
                :a11y="a11yAttrs"
                icono="pi pi-user"
                primero
                @activar="irAPaso(Number(value))"
              />
            </Step>
            <Step v-slot="{ value, a11yAttrs }" asChild :value="2">
              <StepperStep
                :value="Number(value)"
                :active-step="activeStep"
                :a11y="a11yAttrs"
                icono="pi pi-wrench"
                @activar="irAPaso(Number(value))"
              />
            </Step>
            <Step v-slot="{ value, a11yAttrs }" asChild :value="3">
              <StepperStep
                :value="Number(value)"
                :active-step="activeStep"
                :a11y="a11yAttrs"
                icono="pi pi-star"
                @activar="irAPaso(Number(value))"
              />
            </Step>
            <Step v-slot="{ value, a11yAttrs }" asChild :value="4">
              <StepperStep
                :value="Number(value)"
                :active-step="activeStep"
                :a11y="a11yAttrs"
                icono="pi pi-id-card"
                ultimo
                @activar="irAPaso(Number(value))"
              />
            </Step>
          </StepList>

          <StepPanels>
            <StepPanel :value="1">
              <DatosStep
                v-model:anios="aniosExperiencia"
                v-model:radio="radioCobertura"
                v-model:biografia="biografia"
                :cargando="cargandoDatos"
                :cargando-perfil="cargandoPerfil"
                :error-cargando-perfil="errorCargandoPerfil"
                @continuar="guardarDatos"
              />
            </StepPanel>

            <StepPanel :value="2">
              <CategoriasTecnicoStep
                v-model:seleccion="categoriasSeleccionadas"
                v-model:tarifas="tarifasPorCategoria"
                :categorias="categorias"
                :cargando="cargandoCatalogo"
                :guardando="guardandoCategorias"
                @volver="irAPaso(1)"
                @continuar="guardarCategorias"
              />
            </StepPanel>

            <StepPanel :value="3">
              <InfoAdicionalStep @volver="irAPaso(2)" @continuar="irAPaso(4)" />
            </StepPanel>

            <StepPanel :value="4">
              <ListoStep @inicio="router.push('/')" />
            </StepPanel>
          </StepPanels>
        </Stepper>

        <div id="resenas" class="mt-10 rounded-2xl border border-pacific/10 bg-card p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-ink">Mis calificaciones</h2>
              <p class="mt-1 text-sm text-muted">Reseñas que han dejado tus clientes al completar un servicio.</p>
            </div>
            <div v-if="perfilPublico" class="flex items-center gap-2">
              <Rating
                :modelValue="Math.round(perfilPublico.perfil.calificacion_promedio)"
                readonly
                :cancel="false"
              />
              <span class="text-sm font-semibold text-ink">
                {{ Number(perfilPublico.perfil.calificacion_promedio).toFixed(1) }} / 5
              </span>
              <span class="text-xs text-muted">({{ perfilPublico.total_calificaciones }})</span>
            </div>
          </div>

          <div v-if="cargandoResenas" class="mt-4">
            <Skeleton width="100%" height="9rem" />
          </div>
          <p v-else-if="errorResenas" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <i class="pi pi-exclamation-triangle mr-1" />{{ errorResenas }}
          </p>
          <p
            v-else-if="sinPerfilPublico || !perfilPublico?.calificaciones.length"
            class="mt-4 rounded-lg bg-cloud p-4 text-sm text-muted"
          >
            Aún no tienes reseñas. Cuando completes un servicio, tus clientes podrán calificarte aquí.
          </p>
          <ResenasCarousel
            v-else
            :calificaciones="perfilPublico.calificaciones"
            class="mt-4"
          />
        </div>
      </div>
    </section>
  </div>
</template>