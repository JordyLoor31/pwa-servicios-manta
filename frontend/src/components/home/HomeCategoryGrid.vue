<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Carousel from 'primevue/carousel'
import CarouselContent from 'primevue/carouselcontent'
import CarouselItem from 'primevue/carouselitem'
import CarouselIndicators from 'primevue/carouselindicators'
import CarouselPrev from 'primevue/carouselprev'
import CarouselNext from 'primevue/carouselnext'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { categoriasApi } from '../../services/categorias'
import type { CategoriaServicio } from '../../types/categorias'

const categorias = ref<CategoriaServicio[]>([])
const cargando = ref(true)
const error = ref(false)

const imagenes: Record<string, string> = {
  electricidad: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  plomeria: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
  limpieza: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  pintura: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  refrigeracion: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  computacion: 'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=800&q=80',
}

const visibles = computed(() => categorias.value)

const responsiveOptions = [
  { breakpoint: '1280px', numVisible: 4, numScroll: 1 },
  { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
  { breakpoint: '640px', numVisible: 2, numScroll: 1 },
]

function imagenPara(categoria: CategoriaServicio) {
  const clave = categoria.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const coincidencia = Object.keys(imagenes).find((nombre) => clave.includes(nombre))
  return coincidencia ? imagenes[coincidencia] : 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80'
}

onMounted(async () => {
  try {
    categorias.value = await categoriasApi.listarActivas()
  } catch {
    error.value = true
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <section id="categorias" class="scroll-mt-24">
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-turquoise-600">Soluciones para cada necesidad</p>
        <h2 class="mt-1 text-2xl font-bold text-ink sm:text-3xl">Explora nuestras categorías</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">Desde reparaciones hasta mantenimiento, encuentra el profesional que necesitas.</p>
      </div>
      <Tag v-if="categorias.length" :value="`${categorias.length} disponibles`" severity="info" rounded />
    </div>

    <div v-if="cargando" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <Card v-for="n in 8" :key="n" class="overflow-hidden"><template #header><Skeleton height="8rem" /></template><template #content><Skeleton width="70%" /><Skeleton class="mt-2" width="90%" /></template></Card>
    </div>
    <div v-else-if="error" class="rounded-2xl border border-dashed border-pacific/20 bg-card p-8 text-center text-sm text-muted">No pudimos cargar las categorías. Intenta actualizar la página.</div>
    <Carousel
      v-else-if="visibles.length"
      :value="visibles"
      :num-visible="4"
      :num-scroll="1"
      :responsive-options="responsiveOptions"
      class="w-full"
      align="center"
    >
      <CarouselContent class="min-h-[18rem]">
        <CarouselItem v-for="categoria in visibles" :key="categoria.id" class="basis-1/2 px-2 md:basis-1/3 xl:basis-1/4">
          <Card class="group h-full overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <template #header>
              <div class="relative h-36 overflow-hidden">
                <img :src="imagenPara(categoria)" :alt="`Servicio de ${categoria.nombre}`" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-[#062c4d]/80 to-transparent" />
                <div class="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-pacific shadow"><i :class="categoria.icono || 'pi pi-wrench'" /></div>
              </div>
            </template>
            <template #content>
              <h3 class="font-semibold text-ink">{{ categoria.nombre }}</h3>
              <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted">{{ categoria.descripcion || 'Encuentra profesionales para este servicio.' }}</p>
            </template>
          </Card>
        </CarouselItem>
      </CarouselContent>
      <div class="mt-5 flex items-center gap-4">
        <CarouselIndicators />
        <div class="flex flex-1 justify-end gap-2">
          <CarouselPrev class="flex h-9 w-9 items-center justify-center rounded-full border border-surface bg-surface-0 text-surface-500 transition-opacity hover:opacity-75 dark:bg-surface-800 dark:text-surface-400">
            <i class="pi pi-chevron-left" />
          </CarouselPrev>
          <CarouselNext class="flex h-9 w-9 items-center justify-center rounded-full border border-surface bg-surface-0 text-surface-500 transition-opacity hover:opacity-75 dark:bg-surface-800 dark:text-surface-400">
            <i class="pi pi-chevron-right" />
          </CarouselNext>
        </div>
      </div>
    </Carousel>
    <div v-else class="rounded-2xl bg-card p-8 text-center text-sm text-muted">Aún no hay categorías activas.</div>
  </section>
</template>
