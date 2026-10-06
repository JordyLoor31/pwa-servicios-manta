<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useLeafletMap, type LeafletMap, type LeafletMarker } from '../../composables/direcciones/useLeafletMap'
import { buscarDirecciones, buscarReverso, type NominatimResult } from '../../services/nominatim'
import type { Direccion } from '../../types/direcciones'

interface FormDireccion {
  etiqueta: string
  direccion_texto: string
  referencia: string
  ciudad: string
  latitud: string
  longitud: string
  es_principal: boolean
}

const props = defineProps<{
  visible: boolean
  form: FormDireccion
  direccion: Direccion | null
  guardando: boolean
}>()

const emit = defineEmits<{
  'update:visible': [valor: boolean]
  guardar: []
}>()

const toast = useToast()
const { crearMapa } = useLeafletMap()
const sugerencias = ref<NominatimResult[]>([])
let debounceBusqueda: number | undefined
let seleccionando = false
const paso = ref(1)
const contenedorMapa = ref<HTMLElement | null>(null)
const instanciaMapa = ref<{ mapa: LeafletMap; marcador: LeafletMarker } | null>(null)

const visibleModel = ref(props.visible)
watch(() => props.visible, (v) => { visibleModel.value = v })
watch(visibleModel, (v) => {
  emit('update:visible', v)
  if (!v) {
    instanciaMapa.value?.mapa.remove()
    instanciaMapa.value = null
    paso.value = 1
  }
})

watch(() => props.form.direccion_texto, (valor) => {
  if (seleccionando) {
    seleccionando = false
    return
  }
  if (debounceBusqueda) clearTimeout(debounceBusqueda)
  const texto = valor.trim()
  if (texto.length < 3) {
    sugerencias.value = []
    return
  }
  debounceBusqueda = window.setTimeout(async () => {
    try {
      sugerencias.value = await buscarDirecciones(texto)
    } catch (error) {
      sugerencias.value = []
      toast.add({
        severity: 'warn',
        summary: 'Búsqueda',
        detail: error instanceof Error ? error.message : 'No se pudo buscar la dirección',
        life: 3000,
      })
    }
  }, 500)
})

onBeforeUnmount(() => {
  if (debounceBusqueda) clearTimeout(debounceBusqueda)
  instanciaMapa.value?.mapa.remove()
})

watch(() => props.visible, async (abierto) => {
  if (!abierto) return
  paso.value = 1
  await nextTick()
  if (!contenedorMapa.value) return
  const latitud = Number(props.form.latitud)
  const longitud = Number(props.form.longitud)
  const centro =
    !isNaN(latitud) && !isNaN(longitud) && props.form.latitud !== '' && props.form.longitud !== ''
      ? { lat: latitud, lng: longitud }
      : { lat: -0.9499, lng: -80.726 }
  if (props.form.latitud === '' || props.form.longitud === '') {
    props.form.latitud = String(centro.lat)
    props.form.longitud = String(centro.lng)
  }
  try {
    const instancia = await crearMapa(contenedorMapa.value, centro, async (latlng) => {
      props.form.latitud = String(latlng.lat)
      props.form.longitud = String(latlng.lng)
      try {
        const direccion = await buscarReverso(latlng.lat, latlng.lng)
        if (direccion) {
          seleccionando = true
          props.form.direccion_texto = direccion.display_name
          props.form.latitud = String(direccion.lat)
          props.form.longitud = String(direccion.lon)
          props.form.ciudad =
            direccion.address?.city ??
            direccion.address?.town ??
            direccion.address?.village ??
            direccion.address?.municipality ??
            props.form.ciudad
        }
      } catch {
        // no interrumpir si el reverse geocoding falla
      }
    })
    instanciaMapa.value = instancia
    instancia.mapa.invalidateSize()
  } catch (error) {
    toast.add({
      severity: 'warn',
      summary: 'Mapa',
      detail: error instanceof Error ? error.message : 'No se pudo cargar el mapa',
      life: 4000,
    })
  }
})

function actualizarMapa(latitud: number, longitud: number) {
  if (!instanciaMapa.value) return
  instanciaMapa.value.mapa.setView(latitud, longitud, 15)
  instanciaMapa.value.marcador.setLatLng({ lat: latitud, lng: longitud })
}

function siguientePaso() {
  if (!props.form.direccion_texto.trim() || !props.form.latitud || !props.form.longitud) {
    toast.add({
      severity: 'warn',
      summary: 'Faltan datos',
      detail: 'Elige una dirección para continuar.',
      life: 3000,
    })
    return
  }
  paso.value = 2
  void nextTick(() => {
    instanciaMapa.value?.mapa.invalidateSize()
  })
}

function anteriorPaso() {
  paso.value = 1
  void nextTick(() => {
    instanciaMapa.value?.mapa.invalidateSize()
  })
}

function seleccionarSugerencia(resultado: NominatimResult) {
  seleccionando = true
  props.form.direccion_texto = resultado.display_name
  props.form.latitud = String(resultado.lat)
  props.form.longitud = String(resultado.lon)
  props.form.ciudad =
    resultado.address?.city ??
    resultado.address?.town ??
    resultado.address?.village ??
    resultado.address?.municipality ??
    resultado.address?.county ??
    props.form.ciudad
  sugerencias.value = []
  actualizarMapa(Number(resultado.lat), Number(resultado.lon))
}
</script>

<template>
  <Dialog v-model:visible="visibleModel" :header="direccion ? 'Editar dirección' : 'Nueva dirección'" modal class="w-full max-w-lg">
    <div class="mt-2 flex flex-col gap-4">
      <div class="flex items-center gap-2 text-sm text-muted">
        <span :class="paso === 1 ? 'font-semibold text-pacific' : ''">1. Ubicación</span>
        <span>/</span>
        <span :class="paso === 2 ? 'font-semibold text-pacific' : ''">2. Detalles</span>
      </div>

      <div v-show="paso === 1" class="flex flex-col gap-4">
        <FloatLabel variant="on">
          <InputText id="direccion_texto" v-model="form.direccion_texto" class="w-full" />
          <label for="direccion_texto">Dirección *</label>
        </FloatLabel>

        <div v-if="sugerencias.length" class="max-h-40 overflow-auto rounded border border-pacific/10 bg-card text-sm">
          <button
            v-for="(resultado, index) in sugerencias"
            :key="`${resultado.display_name}-${index}`"
            type="button"
            class="w-full px-3 py-2 text-left text-ink hover:bg-pacific/5"
            @click="seleccionarSugerencia(resultado)"
          >
            {{ resultado.display_name }}
          </button>
        </div>

        <div ref="contenedorMapa" class="h-64 w-full rounded-xl border border-pacific/10 bg-cloud"></div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatLabel variant="on">
            <InputText id="latitud" v-model="form.latitud" inputmode="decimal" class="w-full" readonly />
            <label for="latitud">Latitud</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText id="longitud" v-model="form.longitud" inputmode="decimal" class="w-full" readonly />
            <label for="longitud">Longitud</label>
          </FloatLabel>
        </div>

        <FloatLabel variant="on">
          <InputText id="ciudad" v-model="form.ciudad" class="w-full" />
          <label for="ciudad">Ciudad</label>
        </FloatLabel>
      </div>

      <div v-show="paso === 2" class="flex flex-col gap-4">
        <FloatLabel variant="on">
          <InputText id="etiqueta" v-model="form.etiqueta" class="w-full" />
          <label for="etiqueta">Etiqueta (opcional)</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <InputText id="referencia" v-model="form.referencia" class="w-full" />
          <label for="referencia">Referencia (opcional)</label>
        </FloatLabel>

        <div class="flex items-center gap-3">
          <Button
            label="Principal"
            :icon="form.es_principal ? 'pi pi-star' : 'pi pi-star-o'"
            :severity="form.es_principal ? 'success' : 'secondary'"
            variant="outlined"
            @click="form.es_principal = !form.es_principal"
          />
          <span class="text-sm text-muted">Marcar como dirección principal</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button v-if="paso === 2" label="Atrás" severity="secondary" @click="anteriorPaso" />
        <Button v-if="paso === 1" label="Cancelar" severity="secondary" @click="visibleModel = false" />
        <Button
          v-if="paso === 1"
          label="Siguiente"
          icon="pi pi-arrow-right"
          @click="siguientePaso"
        />
        <Button
          v-else
          label="Guardar"
          icon="pi pi-check"
          :loading="guardando"
          @click="emit('guardar')"
        />
      </div>
    </template>
  </Dialog>
</template>
