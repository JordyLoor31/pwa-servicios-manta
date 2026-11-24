<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AppProgressSpinner from '../../components/layout/AppProgressSpinner.vue'
import DireccionFormDialog from '../../components/direcciones/DireccionFormDialog.vue'
import DatosStep from '../../components/perfil-tecnico/DatosStep.vue'
import CategoriasTecnicoStep from '../../components/perfil-tecnico/CategoriasTecnicoStep.vue'
import { useAuthz } from '../../composables/auth/useAuthz'
import { necesitaOnboarding } from '../../composables/auth/useOnboarding'
import { useDirecciones } from '../../composables/direcciones/useDirecciones'
import { useDisponibilidad } from '../../composables/disponibilidad/useDisponibilidad'
import { usePerfilTecnicoForm } from '../../composables/perfil-tecnico/usePerfilTecnicoForm'

const router = useRouter()
const toast = useToast()
const { usuario } = useAuthz()
const esTecnico = computed(() => usuario.value?.rol === 'tecnico')
const paso = ref(1)
const cargando = ref(false)
const verificandoConfiguracion = ref(true)

const {
  direcciones,
  guardando: guardandoDireccion,
  direccionActiva,
  formVisible,
  form,
  cargar: cargarDirecciones,
  abrirCrear,
  guardar: guardarDireccion,
} = useDirecciones()

const {
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
  guardarDatos,
  guardarCategorias,
} = usePerfilTecnicoForm()

const {
  cargando: cargandoDisponibilidad,
  guardando: guardandoDisponibilidad,
  slots,
  dias,
  totalSlots,
  cargar: cargarDisponibilidad,
  agregarSlot,
  quitarSlot,
  guardar: guardarDisponibilidad,
} = useDisponibilidad()

const tituloPaso = computed(() => {
  if (paso.value === 1) return '¿Dónde recibirás o prestarás servicios?'
  if (paso.value === 2) return 'Completa tu perfil profesional'
  if (paso.value === 3) return 'Define tus servicios y tarifas'
  return 'Indica cuándo estás disponible'
})

function abrirDireccion() {
  abrirCrear()
}

async function guardarDireccionInicial() {
  await guardarDireccion()
}

function siguienteDireccion() {
  if (direcciones.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Agrega una dirección',
      detail: 'Necesitamos una dirección para ubicar tus servicios.',
      life: 3500,
    })
    return
  }
  paso.value = esTecnico.value ? 2 : 5
}

async function siguientePerfil() {
  if (
    aniosExperiencia.value == null ||
    radioCobertura.value == null ||
    !biografia.value.trim()
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Completa tu perfil',
      detail: 'Indica experiencia, radio de cobertura y una breve biografía.',
      life: 3500,
    })
    return
  }
  if (await guardarDatos()) paso.value = 3
}

async function siguienteCategorias() {
  if (categoriasSeleccionadas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Selecciona una categoría',
      detail: 'Elige al menos un servicio que ofrezcas.',
      life: 3500,
    })
    return
  }
  if (await guardarCategorias()) paso.value = 4
}

async function finalizar() {
  if (totalSlots.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Agrega un horario',
      detail: 'Registra al menos un horario para que los clientes sepan cuándo contactarte.',
      life: 3500,
    })
    return
  }
  cargando.value = true
  const guardado = await guardarDisponibilidad()
  if (guardado) completar()
  cargando.value = false
}

function completar() {
  router.replace(esTecnico.value ? '/solicitudes/recibidas' : '/solicitudes')
}

onMounted(async () => {
  try {
    const usuarioActual = usuario.value
    if (usuarioActual && !(await necesitaOnboarding(usuarioActual))) {
      await router.replace(esTecnico.value ? '/solicitudes/recibidas' : '/solicitudes')
      return
    }
    await cargarDirecciones()
    if (esTecnico.value) await cargarDisponibilidad()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo verificar la configuración',
      detail: error instanceof Error ? error.message : 'Recarga la página para volver a intentar.',
      life: 5000,
    })
    await router.replace('/')
  } finally {
    verificandoConfiguracion.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-cloud p-4">
    <Toast />
    <div
      v-if="cargando || verificandoConfiguracion"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
    >
      <AppProgressSpinner />
    </div>
    <Card class="w-full max-w-3xl">
      <template #title>Configuremos tu cuenta</template>
      <template #subtitle>
        Completa estos datos una sola vez para usar CamelloApp.
      </template>
      <template #content>
        <div class="mb-6 flex items-center justify-center gap-2 text-xs text-muted">
          <span
            v-for="numero in (esTecnico ? 4 : 1)"
            :key="numero"
            class="flex h-8 w-8 items-center justify-center rounded-full"
            :class="paso === numero ? 'bg-pacific font-semibold text-white' : 'bg-cloud'"
          >{{ numero }}</span>
        </div>

        <div v-if="paso === 1" class="space-y-4 text-center">
          <h2 class="text-xl font-semibold text-ink">{{ tituloPaso }}</h2>
          <p class="text-sm text-muted">
            Necesitamos una ubicación con coordenadas para asignar solicitudes y calcular distancias.
          </p>
          <div v-if="direcciones.length" class="rounded-xl border border-pacific/15 bg-pacific/5 p-4 text-left">
            <p class="font-semibold text-ink">{{ direcciones[0].etiqueta || 'Dirección principal' }}</p>
            <p class="mt-1 text-sm text-muted">{{ direcciones[0].direccion_texto }}</p>
          </div>
          <Button
            :label="direcciones.length ? 'Cambiar dirección' : 'Agregar mi dirección'"
            icon="pi pi-map-marker"
            @click="abrirDireccion"
          />
        </div>

        <DatosStep
          v-else-if="paso === 2"
          v-model:anios="aniosExperiencia"
          v-model:radio="radioCobertura"
          v-model:biografia="biografia"
          :cargando="cargandoDatos"
          :cargando-perfil="cargandoPerfil"
          :error-cargando-perfil="errorCargandoPerfil"
          @continuar="siguientePerfil"
        />
        <CategoriasTecnicoStep
          v-else-if="paso === 3"
          v-model:seleccion="categoriasSeleccionadas"
          v-model:tarifas="tarifasPorCategoria"
          :categorias="categorias"
          :cargando="cargandoCatalogo"
          :guardando="guardandoCategorias"
          @volver="paso = 2"
          @continuar="siguienteCategorias"
        />
        <div v-else-if="paso === 4" class="space-y-4">
          <div class="text-center">
            <h2 class="text-xl font-semibold text-ink">{{ tituloPaso }}</h2>
            <p class="mt-1 text-sm text-muted">Agrega al menos un bloque de atención.</p>
          </div>
          <div v-if="cargandoDisponibilidad" class="flex justify-center py-8"><AppProgressSpinner /></div>
          <div v-else class="grid gap-3 sm:grid-cols-2">
            <div v-for="dia in dias" :key="dia.valor" class="rounded-xl border border-pacific/10 p-3">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-ink">{{ dia.nombre }}</span>
                <Button icon="pi pi-plus" text rounded size="small" :aria-label="`Agregar horario el ${dia.nombre}`" @click="agregarSlot(dia.valor)" />
              </div>
              <div v-for="slot in dia.slots" :key="`${dia.valor}-${dia.slots.indexOf(slot)}`" class="mt-2 flex items-center gap-1">
                <input v-model="slot.hora_inicio" type="time" class="w-full rounded border p-1 text-sm" />
                <span class="text-muted">-</span>
                <input v-model="slot.hora_fin" type="time" class="w-full rounded border p-1 text-sm" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" aria-label="Quitar horario" @click="quitarSlot(slots.indexOf(slot))" />
              </div>
              <p v-if="!dia.slots.length" class="mt-2 text-xs text-muted">Sin horario</p>
            </div>
          </div>
          <div class="flex justify-between pt-2">
            <Button label="Atrás" severity="secondary" variant="outlined" @click="paso = 3" />
            <Button label="Finalizar configuración" icon="pi pi-check" :loading="guardandoDisponibilidad" @click="finalizar" />
          </div>
        </div>

        <div v-else class="space-y-4 text-center">
          <i class="pi pi-check-circle text-5xl text-green-500" />
          <h2 class="text-xl font-semibold text-ink">¡Todo listo!</h2>
          <p class="text-sm text-muted">Ya puedes crear y gestionar tus solicitudes.</p>
          <Button label="Continuar" icon="pi pi-arrow-right" @click="completar" />
        </div>
      </template>
      <template #footer>
        <div v-if="paso === 1" class="flex justify-end">
          <Button label="Continuar" icon="pi pi-arrow-right" :disabled="!direcciones.length" @click="siguienteDireccion" />
        </div>
      </template>
    </Card>

    <DireccionFormDialog
      v-model:visible="formVisible"
      :form="form"
      :direccion="direccionActiva"
      :guardando="guardandoDireccion"
      @guardar="guardarDireccionInicial"
    />
  </div>
</template>
