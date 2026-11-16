<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import Carousel from 'primevue/carousel'
import CarouselContent from 'primevue/carouselcontent'
import CarouselItem from 'primevue/carouselitem'
import CarouselNext from 'primevue/carouselnext'
import CarouselPrev from 'primevue/carouselprev'
import Rating from 'primevue/rating'
import type { CalificacionPublica } from '../../types/perfil-tecnico'

const props = withDefaults(
  defineProps<{
    calificaciones: CalificacionPublica[]
    activo?: boolean
  }>(),
  { activo: true },
)

const slide = ref(0)
let temporizador: ReturnType<typeof setInterval> | null = null

function detenerAutoplay() {
  if (temporizador) {
    clearInterval(temporizador)
    temporizador = null
  }
}

function iniciarAutoplay() {
  detenerAutoplay()
  if (!props.activo || props.calificaciones.length <= 1) return
  temporizador = setInterval(() => {
    slide.value = (slide.value + 1) % props.calificaciones.length
  }, 5000)
}

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

watch(
  () => props.calificaciones,
  () => {
    slide.value = 0
    iniciarAutoplay()
  },
)

watch(
  () => props.activo,
  (activo) => {
    if (activo) iniciarAutoplay()
    else detenerAutoplay()
  },
)

iniciarAutoplay()
onBeforeUnmount(detenerAutoplay)
</script>

<template>
  <div @mouseenter="detenerAutoplay" @mouseleave="iniciarAutoplay">
    <Carousel v-model:slide="slide" :loop="true" align="start" :spacing="16">
      <CarouselContent>
        <CarouselItem v-for="calificacion in calificaciones" :key="calificacion.id">
          <div class="flex min-h-40 flex-col rounded-xl border border-pacific/10 bg-card p-4">
            <div class="flex flex-wrap items-center justify-between gap-1">
              <p class="font-medium text-ink">
                {{ calificacion.cliente.nombres }} {{ calificacion.cliente.apellidos }}
              </p>
              <span class="text-xs text-muted">{{ fecha(calificacion.fecha_creacion) }}</span>
            </div>
            <Rating :modelValue="calificacion.calificacion" readonly :cancel="false" class="mt-1" />
            <p v-if="calificacion.comentario" class="mt-2 whitespace-pre-line text-ink">
              {{ calificacion.comentario }}
            </p>
            <p v-else class="mt-2 text-muted">Sin comentario.</p>
          </div>
        </CarouselItem>
      </CarouselContent>
      <div class="mt-4 flex items-center justify-between gap-4">
        <span class="text-xs text-muted">{{ slide + 1 }} / {{ calificaciones.length }}</span>
        <div class="flex items-center gap-2">
          <CarouselPrev
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-pacific/20 bg-card text-muted transition-colors hover:bg-pacific/10 disabled:cursor-default disabled:opacity-40"
          >
            <i class="pi pi-chevron-left text-sm" />
          </CarouselPrev>
          <CarouselNext
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-pacific/20 bg-card text-muted transition-colors hover:bg-pacific/10 disabled:cursor-default disabled:opacity-40"
          >
            <i class="pi pi-chevron-right text-sm" />
          </CarouselNext>
        </div>
      </div>
    </Carousel>
  </div>
</template>
