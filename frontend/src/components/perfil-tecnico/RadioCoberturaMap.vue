<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLeafletMap, type LeafletCoverageMap } from '../../composables/direcciones/useLeafletMap'

const props = defineProps<{
  latitud: number
  longitud: number
  radio: number
}>()

const contenedor = ref<HTMLDivElement | null>(null)
const cargando = ref(true)
const errorMapa = ref('')
const { crearMapaCobertura } = useLeafletMap()
let mapaCobertura: LeafletCoverageMap | null = null
let desmontado = false

function actualizarCobertura() {
  if (!mapaCobertura) return
  const centro: [number, number] = [props.latitud, props.longitud]
  mapaCobertura.marcador.setLatLng(centro)
  mapaCobertura.circulo.setLatLng(centro)
  mapaCobertura.circulo.setRadius(props.radio * 1000)
  const zoom = Math.max(3, Math.min(16, Math.floor(13 - Math.log2(Math.max(props.radio, 0.5)))))
  mapaCobertura.mapa.setView([props.latitud, props.longitud], zoom)
  mapaCobertura.mapa.invalidateSize()
}

watch(() => [props.latitud, props.longitud, props.radio], actualizarCobertura)

onMounted(async () => {
  await nextTick()
  if (!contenedor.value) return
  try {
    const cobertura = await crearMapaCobertura(
      contenedor.value,
      { lat: props.latitud, lng: props.longitud },
      props.radio,
    )
    if (desmontado) {
      cobertura.mapa.remove()
      return
    }
    mapaCobertura = cobertura
    actualizarCobertura()
  } catch (error) {
    errorMapa.value = error instanceof Error ? error.message : 'No se pudo cargar el mapa de cobertura.'
  } finally {
    cargando.value = false
  }
})

onBeforeUnmount(() => {
  desmontado = true
  mapaCobertura?.mapa.remove()
  mapaCobertura = null
})
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-pacific/15">
    <div ref="contenedor" class="h-64 w-full bg-slate-100" />
    <p v-if="cargando" class="px-3 py-2 text-xs text-muted">Cargando mapa de cobertura…</p>
    <p v-else-if="errorMapa" class="px-3 py-2 text-xs text-red-600">{{ errorMapa }}</p>
  </div>
</template>
