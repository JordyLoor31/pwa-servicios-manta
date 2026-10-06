<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { categoriasApi } from '../../services/categorias'
import { solicitudesApi } from '../../services/solicitudes'
import { nombreDia } from '../../composables/disponibilidad/useDisponibilidad'
import type { CategoriaServicio } from '../../types/categorias'
import type { Solicitud, TecnicoDirectorio } from '../../types/solicitudes'

const visible = defineModel<boolean>('visible', { required: true })

const emit = defineEmits<{ creada: [solicitud: Solicitud] }>()

const toast = useToast()

const categorias = ref<CategoriaServicio[]>([])
const categoriasSeleccionadas = ref<string[]>([])
const fechaServicio = ref<Date>(new Date())
const tecnicos = ref<TecnicoDirectorio[]>([])
const cargandoTecnicos = ref(false)
const horas = ref<string[]>([])
const horaBusqueda = ref('')
const enviando = ref(false)
const form = ref({ tecnico_id: '', descripcion: '', direccion: '' })

async function cargarCategorias() {
  if (categorias.value.length > 0) return
  try {
    categorias.value = await categoriasApi.listarActivas()
  } catch {
    categorias.value = []
  }
}

async function cargarTecnicos() {
  cargandoTecnicos.value = true
  try {
    tecnicos.value = await solicitudesApi.tecnicosDisponiblesPorDia(
      fechaServicio.value.getDay(),
      categoriasSeleccionadas.value,
    )
    horas.value = []
    horaBusqueda.value = ''
    if (form.value.tecnico_id && !tecnicos.value.some((t) => t.id === form.value.tecnico_id)) {
      form.value.tecnico_id = ''
    }
  } catch {
    tecnicos.value = []
    horas.value = []
    horaBusqueda.value = ''
  } finally {
    cargandoTecnicos.value = false
  }
}

async function cargarHoras() {
  const tecnicoId = form.value.tecnico_id
  if (!tecnicoId) {
    horas.value = []
    horaBusqueda.value = ''
    return
  }
  try {
    horas.value = await solicitudesApi.horariosDisponiblesParaTecnico(
      fechaServicio.value.getDay(),
      tecnicoId,
      categoriasSeleccionadas.value,
    )
    horaBusqueda.value = horas.value[0] ?? ''
  } catch {
    horas.value = []
    horaBusqueda.value = ''
  }
}

watch(visible, (abierto) => {
  if (!abierto) return
  form.value = { tecnico_id: '', descripcion: '', direccion: '' }
  categoriasSeleccionadas.value = []
  fechaServicio.value = new Date()
  horas.value = []
  horaBusqueda.value = ''
  void cargarCategorias()
  void cargarTecnicos()
})

watch(fechaServicio, () => {
  void cargarTecnicos()
})

watch(categoriasSeleccionadas, () => {
  void cargarTecnicos()
})

watch(
  () => form.value.tecnico_id,
  () => {
    void cargarHoras()
  },
)

function aFechaISO(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

async function crear() {
  const descripcion = form.value.descripcion.trim()
  if (!horaBusqueda.value || descripcion.length < 10) {
    toast.add({
      severity: 'warn',
      summary: 'Faltan datos',
      detail: 'Elige hora y describe la necesidad (mínimo 10 caracteres).',
      life: 3000,
    })
    return
  }
  enviando.value = true
  try {
    const payload: {
      tecnico_id?: string
      descripcion: string
      direccion?: string
      fecha_propuesta: string
      hora_propuesta: string
    } = {
      descripcion,
      direccion: form.value.direccion.trim() || undefined,
      fecha_propuesta: aFechaISO(fechaServicio.value),
      hora_propuesta: horaBusqueda.value,
    }
    if (form.value.tecnico_id) payload.tecnico_id = form.value.tecnico_id
    const creada = await solicitudesApi.crear(payload)
    toast.add({ severity: 'success', summary: 'Solicitud enviada', life: 3000 })
    visible.value = false
    emit('creada', creada)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'No se pudo enviar la solicitud',
      life: 4000,
    })
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Nueva solicitud de servicio" modal class="w-full max-w-lg">
    <div class="mt-2 flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label for="categorias" class="text-sm font-medium text-ink">Categoría del servicio *</label>
        <Listbox
          id="categorias"
          v-model="categoriasSeleccionadas"
          :options="categorias"
          multiple
          checkbox
          option-label="nombre"
          option-value="id"
          class="w-full"
        />
        <p v-if="categorias.length === 0" class="text-xs text-muted">Cargando categorías…</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="dia" class="text-sm font-medium text-ink">Día del servicio *</label>
        <DatePicker
          id="dia"
          v-model="fechaServicio"
          :min-date="new Date()"
          date-format="dd/mm/yy"
          class="w-full"
          show-icon
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="tecnico" class="text-sm font-medium text-ink">Técnico (opcional)</label>
        <Select
          id="tecnico"
          v-model="form.tecnico_id"
          :options="tecnicos"
          option-label="nombres"
          option-value="id"
          :loading="cargandoTecnicos"
          :placeholder="tecnicos.length ? 'Elige un técnico' : 'Sin técnicos este día'"
          class="w-full"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-pacific" />
              <span>{{ option.nombres }} {{ option.apellidos }}</span>
              <Tag
                v-if="option.verificado"
                value="Verificado"
                icon="pi pi-shield-check"
                severity="success"
                class="ml-auto"
              />
            </div>
          </template>
        </Select>
        <p v-if="!cargandoTecnicos && tecnicos.length === 0" class="text-xs text-muted">
          Ningún técnico trabaja el {{ nombreDia(fechaServicio.getDay()) }} con la categoría elegida.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="hora" class="text-sm font-medium text-ink">Hora aproximada de llegada *</label>
        <Select
          id="hora"
          v-model="horaBusqueda"
          :options="horas"
          :disabled="!form.tecnico_id"
          :placeholder="form.tecnico_id ? 'Elige una hora' : 'Primero elige un técnico'"
          class="w-full"
        />
        <p v-if="form.tecnico_id && horas.length === 0" class="text-xs text-muted">
          Ese técnico no tiene horarios ese día.
        </p>
        <p class="text-xs text-muted">
          Es una hora tentativa: el técnico acordará la hora exacta de llegada contigo.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="descripcion" class="text-sm font-medium text-ink">Describe lo que necesitas *</label>
        <Textarea
          id="descripcion"
          v-model="form.descripcion"
          rows="4"
          auto-resize
          placeholder="Ej.: Necesito reparar la lavadora, el motor no gira y hace ruido."
          class="w-full"
        />
      </div>

      <FloatLabel variant="on">
        <InputText id="direccion" v-model="form.direccion" class="w-full" />
        <label for="direccion">Dirección del servicio (opcional)</label>
      </FloatLabel>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="visible = false" />
        <Button label="Enviar solicitud" icon="pi pi-send" :loading="enviando" @click="crear" />
      </div>
    </template>
  </Dialog>
</template>