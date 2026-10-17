<script setup lang="ts">
const pasos = [
  { numero: '01', titulo: 'Cuéntanos qué necesitas', texto: 'Publica una solicitud con tu categoría, ubicación y horario.' },
  { numero: '02', titulo: 'Compara propuestas', texto: 'Revisa perfiles, reseñas, verificación y tarifas de los técnicos.' },
  { numero: '03', titulo: 'Elige con confianza', texto: 'Acepta la propuesta ideal y sigue el servicio en cada etapa.' },
]
</script>

<template>
  <section class="rounded-3xl bg-[#062c4d] px-6 py-8 text-white sm:px-10 sm:py-10">
    <div class="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-amber-300">Simple y transparente</p>
        <h2 class="mt-2 text-2xl font-bold sm:text-3xl">Así funciona CamelloApp</h2>
        <p class="mt-3 text-sm leading-6 text-slate-300">Todo lo que necesitas para contratar servicios locales, en un solo lugar.</p>
      </div>
      <div class="grid gap-5 sm:grid-cols-3">
        <div v-for="paso in pasos" :key="paso.numero" class="border-l border-white/20 pl-4">
          <span class="text-2xl font-bold text-amber-300">{{ paso.numero }}</span>
          <h3 class="mt-2 font-semibold">{{ paso.titulo }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-300">{{ paso.texto }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
