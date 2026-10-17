<script setup lang="ts">
import Card from 'primevue/card'

const beneficios = [
  { icono: 'pi pi-shield', titulo: 'Técnicos verificados', descripcion: 'Perfiles con información clara, experiencia y calificaciones reales.' },
  { icono: 'pi pi-comments', titulo: 'Propuestas a tu medida', descripcion: 'Recibe tarifas y mensajes antes de elegir a quién contratar.' },
  { icono: 'pi pi-bolt', titulo: 'Atención local', descripcion: 'Encuentra ayuda cerca de ti para resolverlo sin complicaciones.' },
]
</script>

<template>
  <section class="grid gap-4 md:grid-cols-3">
    <Card v-for="beneficio in beneficios" :key="beneficio.titulo" class="border border-slate-200/80 shadow-sm transition-transform hover:-translate-y-1 dark:border-white/10">
      <template #content>
        <div class="flex gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-turquoise-50 text-xl text-turquoise-600 dark:bg-turquoise-900/30">
            <i :class="beneficio.icono" />
          </div>
          <div>
            <h2 class="font-semibold text-ink">{{ beneficio.titulo }}</h2>
            <p class="mt-1 text-sm leading-6 text-muted">{{ beneficio.descripcion }}</p>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>
