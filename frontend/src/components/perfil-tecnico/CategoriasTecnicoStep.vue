<script setup lang="ts">
import { watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Select from 'primevue/select'
import type { CategoriaServicio, RangoPrecio, UnidadCobro } from '../../types/perfil-tecnico'

const props = defineProps<{
  categorias: CategoriaServicio[]
  cargando: boolean
  guardando: boolean
}>()

const seleccion = defineModel<string[]>('seleccion', { default: () => [] })
const tarifas = defineModel<Record<string, RangoPrecio>>('tarifas', { default: () => ({}) })

defineEmits<{ volver: []; continuar: [] }>()

const unidades = [
  { label: 'Por hora', value: 'por_hora' },
  { label: 'Por servicio', value: 'por_servicio' },
]

watch(
  seleccion,
  (ids) => {
    for (const id of ids) {
      if (!tarifas.value[id]) {
        tarifas.value[id] = { min: '', max: '', unidad: 'por_servicio' }
      }
    }
  },
  { deep: true },
)

function unidadLabel(unidad: UnidadCobro): string {
  return unidad === 'por_hora' ? 'por hora' : 'por servicio'
}

function rangoTexto(id: string): string | null {
  const rango = tarifas.value[id]
  if (!rango) return null
  const min = Number(rango.min)
  const max = Number(rango.max)
  if (rango.min.trim() === '' || rango.max.trim() === '') return null
  if (isNaN(min) || isNaN(max)) return 'Rango inválido'
  return `${min.toFixed(2)} – ${max.toFixed(2)} $ / ${unidadLabel(rango.unidad || 'por_servicio')}`
}
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-lg flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Categorías y servicios</div>
    <p class="text-center text-sm text-muted">
      Selecciona las categorías que ofreces y define tu rango de precio (mínimo–máximo) y la unidad de cobro.
    </p>

    <div v-if="cargando" class="flex justify-center py-8 text-2xl text-pacific">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <div v-else-if="categorias.length === 0" class="py-8 text-center text-sm text-muted">
      Aún no hay categorías de servicio disponibles.
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="categoria in categorias"
        :key="categoria.id"
        class="rounded-xl border-2 bg-card p-3 transition-colors"
        :class="
          seleccion.includes(categoria.id)
            ? 'border-pacific bg-pacific/5'
            : 'border-ink/15 hover:border-pacific/50'
        "
      >
        <div class="flex items-start gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud text-muted">
            <i :class="categoria.icono ?? 'pi pi-tag'" class="pi" />
          </div>
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <Checkbox
              v-model="seleccion"
              :input-id="categoria.id"
              name="categorias"
              :value="categoria.id"
            />
            <Label :for="categoria.id" class="min-w-0 cursor-pointer">
              <div class="truncate font-semibold text-ink">{{ categoria.nombre }}</div>
              <div v-if="categoria.descripcion" class="truncate text-xs text-muted">
                {{ categoria.descripcion }}
              </div>
            </Label>
          </div>
          <span
            v-if="seleccion.includes(categoria.id)"
            class="shrink-0 self-center text-xs font-semibold text-turquoise-600"
          >
            {{ rangoTexto(categoria.id) }}
          </span>
        </div>

        <div
          v-if="seleccion.includes(categoria.id)"
          class="mt-3 grid gap-3 border-t border-pacific/20 pt-3 sm:grid-cols-3"
        >
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-ink">Precio mín.</span>
            <InputText v-model="tarifas[categoria.id].min" inputmode="decimal" placeholder="$ 0.00" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-ink">Precio máx.</span>
            <InputText v-model="tarifas[categoria.id].max" inputmode="decimal" placeholder="$ 0.00" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-ink">Unidad</span>
            <Select
              v-model="tarifas[categoria.id].unidad"
              :options="unidades"
              option-label="label"
              option-value="value"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="flex justify-between pt-5">
    <Button severity="secondary" variant="outlined" @click="$emit('volver')">
      <i class="pi pi-arrow-left mr-2" />
      Volver
    </Button>
    <Button :loading="guardando" @click="$emit('continuar')">
      Guardar y continuar
      <i class="pi pi-arrow-right ml-2" />
    </Button>
  </div>
</template>