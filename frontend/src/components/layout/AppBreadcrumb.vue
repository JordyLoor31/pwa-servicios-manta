<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'

const route = useRoute()

interface BreadcrumbItem {
  label: string
  icon?: string
  ruta?: string
}

function etiqueta(ruta: string) {
  const mapa: Record<string, string> = {
    '/': 'Inicio',
    '/cuenta': 'Mi cuenta',
    '/solicitudes': 'Mis solicitudes',
    '/solicitudes/recibidas': 'Solicitudes recibidas',
    '/perfil': 'Perfil',
    '/disponibilidad': 'Mi disponibilidad',
    '/certificaciones': 'Mis certificaciones',
    '/direcciones': 'Mis direcciones',
    '/categorias': 'Categorías',
    '/usuarios': 'Usuarios',
    '/tecnicos': 'Técnicos',
  }
  return mapa[ruta] ?? ruta
}

const items = computed<BreadcrumbItem[]>(() => {
  const segmentos = route.path.split('/').filter(Boolean)
  const lista: BreadcrumbItem[] = []
  let ruta = ''
  for (const [indice, segmento] of segmentos.entries()) {
    ruta += `/${segmento}`
    const esUltimo = indice === segmentos.length - 1
    const label = esUltimo && route.meta.etiqueta ? route.meta.etiqueta : etiqueta(ruta)
    lista.push({ label, ruta })
  }
  if (segmentos.length === 0) {
    return []
  }
  return lista
})

const home = { icon: 'pi pi-home', label: 'Inicio', ruta: '/' }
const tituloActual = computed(() => items.value[items.value.length - 1]?.label ?? 'Inicio')
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center px-0 py-1.5 sm:px-3">
    <Breadcrumb :model="items" :home="home" class="hidden min-w-0 flex-1 sm:flex">
      <template #item="{ item, icon }">
        <RouterLink
          :to="item.ruta ?? '/'"
          class="p-breadcrumb-item-link flex items-center gap-1 cursor-pointer"
        >
          <i :class="icon ?? item.icon" v-if="icon || item.icon" />
          <span v-if="item.label">{{ item.label }}</span>
        </RouterLink>
      </template>
    </Breadcrumb>
    <span class="min-w-0 flex-1 truncate text-sm text-muted sm:hidden">
      {{ tituloActual }}
    </span>
  </div>
</template>
