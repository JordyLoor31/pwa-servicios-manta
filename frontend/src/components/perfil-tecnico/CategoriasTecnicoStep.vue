<script setup lang="ts">
import { watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Label from 'primevue/label'
import Select from 'primevue/select'
import type { CategoriaServicio, RangoPrecio } from '../../types/perfil-tecnico'
import { tiposServicioParaCategoria } from '../../utils/tiposServicio'
import AppProgressSpinner from '../layout/AppProgressSpinner.vue'

const props = defineProps<{
  categorias: CategoriaServicio[]
  cargando: boolean
  guardando: boolean
}>()

const seleccion = defineModel<string[]>('seleccion', { default: () => [] })
const tarifas = defineModel<Record<string, RangoPrecio[]>>('tarifas', { default: () => ({}) })

defineEmits<{ volver: []; continuar: [] }>()

watch(
  seleccion,
  (ids) => {
    for (const id of ids) {
      if (!tarifas.value[id]) {
        tarifas.value[id] = [
          {
            precio: '',
            tipoServicio: tiposServicioParaCategoria(
              props.categorias.find((categoria) => categoria.id === id)?.nombre ?? '',
            )[0],
            negociable: true,
            unidad: 'por_visita',
          },
        ]
      }
    }
  },
  { deep: true },
)

function tarifaTexto(id: string): string {
  const cantidad = tarifas.value[id]?.length ?? 0
  return `${cantidad} ${cantidad === 1 ? 'servicio configurado' : 'servicios configurados'}`
}

function tarifaValida(rango: RangoPrecio): boolean {
  const precio = Number(rango.precio)
  return rango.precio.trim() !== '' && rango.tipoServicio.trim() !== '' && !isNaN(precio)
}
</script>

<template>
  <div class="mx-auto flex min-h-64 max-w-lg flex-col gap-4">
    <div class="mb-2 text-center text-lg font-semibold text-ink">Categorías y servicios</div>
    <p class="text-center text-sm text-muted">
      Selecciona las categorías que ofreces, el tipo de servicio y tu precio por visita.
    </p>

    <div v-if="cargando" class="flex justify-center py-8 text-2xl text-pacific">
      <AppProgressSpinner />
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
            {{ tarifaTexto(categoria.id) }}
          </span>
        </div>

        <div
          v-if="seleccion.includes(categoria.id)"
          class="mt-3 flex flex-col gap-3 border-t border-pacific/20 pt-3"
        >
          <div
            v-for="(tarifa, indice) in tarifas[categoria.id]"
            :key="tarifa.id ?? `${categoria.id}-${indice}`"
            class="grid gap-3 rounded-lg bg-cloud/70 p-3 sm:grid-cols-[1fr_0.7fr_0.8fr_auto]"
          >
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-ink">Tipo de servicio</span>
              <Select
                v-model="tarifa.tipoServicio"
                :options="tiposServicioParaCategoria(categoria.nombre)"
                placeholder="Selecciona un tipo"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-ink">Precio por visita</span>
              <InputText v-model="tarifa.precio" inputmode="decimal" placeholder="$ 0.00" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs font-medium text-ink">Condición</span>
              <Select
                v-model="tarifa.negociable"
                :options="[
                  { label: 'Negociable', value: true },
                  { label: 'No negociable', value: false },
                ]"
                option-label="label"
                option-value="value"
              />
            </label>
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              :disabled="tarifas[categoria.id].length <= 1"
              :aria-label="`Eliminar ${tarifa.tipoServicio}`"
              @click="tarifas[categoria.id].splice(indice, 1)"
            />
            <p v-if="!tarifaValida(tarifa)" class="text-xs text-red-500 sm:col-span-4">
              Completa el tipo de servicio y un precio válido.
            </p>
          </div>
          <Button
            label="Agregar otro tipo de servicio"
            icon="pi pi-plus"
            severity="secondary"
            variant="outlined"
            size="small"
            class="self-start"
            @click="
              tarifas[categoria.id].push({
                precio: '',
                tipoServicio: tiposServicioParaCategoria(categoria.nombre)[0],
                negociable: true,
                unidad: 'por_visita',
              })
            "
          />
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