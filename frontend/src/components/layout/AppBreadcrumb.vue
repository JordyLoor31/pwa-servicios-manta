<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'

const route = useRoute()
const router = useRouter()

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
  for (const segmento of segmentos) {
    ruta += `/${segmento}`
    lista.push({ label: etiqueta(ruta), ruta })
  }
  if (segmentos.length === 0) {
    return []
  }
  return lista
})

const home = { icon: 'pi pi-home', label: 'Inicio', ruta: '/' }
</script>

<template>
  <div class="flex items-center justify-between px-3 py-1.5 sm:px-6">
    <Breadcrumb :model="items" :home="home" class="flex-1">
      <template #item="{ item, icon }">
        <a
          class="p-breadcrumb-item-link flex items-center gap-1 cursor-pointer"
          @click="item.ruta && router.push(item.ruta)"
        >
          <i :class="icon ?? item.icon" v-if="icon || item.icon" />
          <span v-if="item.label">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>
  </div>
</template>
