<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import type { CategoriaServicio, RangoPrecio } from '../../types/perfil-tecnico'

const props = defineProps<{
  categorias: CategoriaServicio[]
  cargando: boolean
  guardando: boolean
}>()

const seleccion = defineModel<string[]>('seleccion', { default: () => [] })
const tarifas = defineModel<Record<string, RangoPrecio>>('tarifas', { default: () => ({}) })

defineEmits<{ volver: []; continuar: [] }>()

function alternar(id: string) {
  const indice = seleccion.value.indexOf(id)
  if (indice >= 0) {
    seleccion.value.splice(indice, 1)
  } else {
    seleccion.value.push(id)
    if (!tarifas.value[id]) {
      tarifas.value[id] = { min: '', max: '' }
    }
  }
}

function rangoTexto(id: string): string | null {
  const rango = tarifas.value[id]
  if (!rango) return null
  const min = Number(rango.min)
  const max = Number(rango.max)
  if (rango.min.trim() === '' || rango.max.trim() === '') return null
  if (isNaN(min) || isNaN(max)) return 'Rango inválido'
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`
}
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-lg flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Categorías y servicios</div>
    <p class="text-center text-sm text-muted">
      Selecciona las categorías que ofreces y define tu rango de precio (mínimo–máximo).
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
            ? 'border-pacific bg-pacific-50'
            : 'border-ink/15 hover:border-pacific/50'
        "
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 text-left"
          @click="alternar(categoria.id)"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              :class="[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                seleccion.includes(categoria.id) ? 'bg-pacific text-white' : 'bg-cloud text-muted',
              ]"
            >
              <i :class="categoria.icono ?? 'pi pi-tag'" class="pi" />
            </span>
            <div class="min-w-0">
              <div class="truncate font-semibold text-ink">{{ categoria.nombre }}</div>
              <div v-if="categoria.descripcion" class="truncate text-xs text-muted">{{ categoria.descripcion }}</div>
            </div>
          </div>
          <span class="shrink-0 text-sm font-semibold" :class="rangoTexto(categoria.id) ? 'text-turquoise-600' : 'text-muted'">
            {{ rangoTexto(categoria.id) ?? 'Sin precio' }}
          </span>
          <i
            :class="seleccion.includes(categoria.id) ? 'pi-check-circle text-pacific' : 'pi-circle text-muted'"
          />
        </button>

        <div
          v-if="seleccion.includes(categoria.id)"
          class="mt-3 grid grid-cols-2 gap-3 border-t border-pacific/15 pt-3"
        >
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-ink">Precio mín.</span>
            <InputText v-model="tarifas[categoria.id].min" inputmode="decimal" placeholder="$ 0.00" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-ink">Precio máx.</span>
            <InputText v-model="tarifas[categoria.id].max" inputmode="decimal" placeholder="$ 0.00" />
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