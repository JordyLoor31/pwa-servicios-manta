<script setup lang="ts">
import { useRouter } from 'vue-router'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import StepPanels from 'primevue/steppanels'
import Step from 'primevue/step'
import StepPanel from 'primevue/steppanel'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import StepperStep from '../../components/stepper/StepperStep.vue'
import DatosStep from '../../components/perfil-tecnico/DatosStep.vue'
import CategoriasTecnicoStep from '../../components/perfil-tecnico/CategoriasTecnicoStep.vue'
import InfoAdicionalStep from '../../components/perfil-tecnico/InfoAdicionalStep.vue'
import ListoStep from '../../components/perfil-tecnico/ListoStep.vue'
import { usePerfilTecnicoForm } from '../../composables/usePerfilTecnicoForm'

const router = useRouter()

const {
  activeStep,
  cargandoDatos,
  cargandoCatalogo,
  guardandoCategorias,
  aniosExperiencia,
  radioCobertura,
  biografia,
  categorias,
  tarifas,
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
                @continuar="guardarDatos"
              />
            </StepPanel>

            <StepPanel :value="2">
              <CategoriasTecnicoStep
                v-model:seleccion="categoriasSeleccionadas"
                :categorias="categorias"
                :tarifas="tarifas"
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
      </div>
    </section>
  </div>
</template>