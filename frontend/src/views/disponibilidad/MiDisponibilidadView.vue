<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useDisponibilidad } from '../../composables/disponibilidad/useDisponibilidad'

const { cargando, guardando, slots, dias, totalSlots, cargar, agregarSlot, quitarSlot, vaciar, guardar } =
  useDisponibilidad()

function confirmarVaciar() {
  if (slots.value.length === 0) return
  vaciar()
}

onMounted(cargar)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-cloud">
    <AppHeader />
    <section class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Toast />

      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Mi disponibilidad</h1>
          <p class="mt-1 text-sm text-muted">
            Define los días y horarios en los que atiendes servicios.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            variant="outlined"
            :disabled="cargando"
            @click="cargar"
          />
          <Button
            label="Vaciar todo"
            icon="pi pi-trash"
            severity="danger"
            variant="outlined"
            :disabled="totalSlots === 0 || cargando"
            @click="confirmarVaciar"
          />
          <Button
            label="Guardar disponibilidad"
            icon="pi pi-check"
            :loading="guardando"
            :disabled="cargando"
            @click="guardar"
          />
        </div>
      </div>

      <div v-if="cargando" class="flex flex-col gap-4">
        <div v-for="i in 3" :key="i" class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm">
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="40%" height="1rem" class="mt-3" />
        </div>
      </div>

      <div v-else>
        <p v-if="totalSlots === 0" class="mb-5 flex items-center gap-2 text-sm text-muted">
          <i class="pi pi-info-circle" />Aún no has registrado horarios: agrega uno en los días que atiendes.
        </p>
        <div class="flex flex-col gap-4">
          <div
            v-for="dia in dias"
            :key="dia.valor"
            class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-ink">{{ dia.nombre }}</span>
              <span v-if="dia.slots.length" class="text-xs text-muted">
                {{ dia.slots.length }} horario{{ dia.slots.length === 1 ? '' : 's' }}
              </span>
            </div>

            <div v-if="dia.slots.length" class="mt-3 flex flex-col gap-2">
              <div
                v-for="(slot, index) in dia.slots"
                :key="`${dia.valor}-${index}`"
                class="flex items-center gap-2"
              >
                <input
                  :id="`inicio-${dia.valor}-${index}`"
                  v-model="slot.hora_inicio"
                  type="time"
                  class="w-28 rounded-lg border border-pacific/20 bg-cloud px-3 py-2 text-sm text-ink focus:border-pacific focus:outline-none"
                  aria-label="Hora de inicio"
                />
                <span class="text-muted">a</span>
                <input
                  :id="`fin-${dia.valor}-${index}`"
                  v-model="slot.hora_fin"
                  type="time"
                  class="w-28 rounded-lg border border-pacific/20 bg-cloud px-3 py-2 text-sm text-ink focus:border-pacific focus:outline-none"
                  aria-label="Hora de fin"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Quitar horario"
                  @click="quitarSlot(slots.indexOf(slot))"
                />
              </div>
            </div>

            <Button
              label="Agregar horario"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              variant="outlined"
              class="mt-3"
              @click="agregarSlot(dia.valor)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>