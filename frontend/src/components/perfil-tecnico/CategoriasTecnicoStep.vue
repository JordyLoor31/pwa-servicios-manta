<script setup lang="ts">
import Button from 'primevue/button'
import type { CategoriaServicio, TarifaCategoria } from '../../types/perfil-tecnico'

const props = defineProps<{
  categorias: CategoriaServicio[]
  tarifas: TarifaCategoria[]
  cargando: boolean
  guardando: boolean
}>()

const seleccion = defineModel<string[]>('seleccion', { default: () => [] })

defineEmits<{ volver: []; continuar: [] }>()

function alternar(id: string) {
  const indice = seleccion.value.indexOf(id)
  if (indice >= 0) {
    seleccion.value.splice(indice, 1)
  } else {
    seleccion.value.push(id)
  }
}

function tarifaDe(categoriaId: string): TarifaCategoria | undefined {
  return props.tarifas.find((tarifa) => tarifa.categoria_id === categoriaId)
}

function nombreUnidad(unidad: string) {
  return unidad === 'por_hora' ? 'hora' : 'servicio'
}
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-lg flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Categorías y servicios</div>
    <p class="text-center text-sm text-muted">Selecciona las categorías que ofreces. El precio base lo define la plataforma.</p>

    <div v-if="cargando" class="flex justify-center py-8 text-2xl text-pacific">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <div v-else-if="categorias.length === 0" class="py-8 text-center text-sm text-muted">
      Aún no hay categorías de servicio disponibles.
    </div>

    <div v-else class="flex flex-col gap-2">
      <button
        v-for="categoria in categorias"
        :key="categoria.id"
        type="button"
        class="flex items-center justify-between gap-3 rounded-xl border-2 bg-card p-3 text-left transition-colors"
        :class="
          seleccion.includes(categoria.id)
            ? 'border-pacific bg-pacific-50'
            : 'border-ink/15 hover:border-pacific/50'
        "
        @click="alternar(categoria.id)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            :class="[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              seleccion.includes(categoria.id) ? 'bg-pacific text-white' : 'bg-cloud text-muted',
            ]"
          >
            <i :class="categoria.icono ?? 'pi-tag'" class="pi" />
          </span>
          <div class="min-w-0">
            <div class="truncate font-semibold text-ink">{{ categoria.nombre }}</div>
            <div v-if="categoria.descripcion" class="truncate text-xs text-muted">{{ categoria.descripcion }}</div>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <span class="text-sm font-semibold" :class="tarifaDe(categoria.id) ? 'text-turquoise-600' : 'text-muted'">
            <template v-if="tarifaDe(categoria.id)">
              ${{ tarifaDe(categoria.id)!.precio_base.toFixed(2) }}
              / {{ nombreUnidad(tarifaDe(categoria.id)!.unidad_cobro) }}
            </template>
            <template v-else>Sin tarifa</template>
          </span>
          <i
            :class="seleccion.includes(categoria.id) ? 'pi-check-circle text-pacific' : 'pi-circle text-muted'"
          />
        </div>
      </button>
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