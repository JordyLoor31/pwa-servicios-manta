<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import { useTheme } from '../../composables/useTheme'
import { useAuthz, cerrarSesion } from '../../composables/auth/useAuthz'

const router = useRouter()
const visible = ref(false)
const { isDark, toggle } = useTheme()
const { usuario, hasAnyRole } = useAuthz()

const iniciales = computed(() => {
  const u = usuario.value
  if (!u) return 'CA'
  return `${u.nombres?.[0] ?? ''}${u.apellidos?.[0] ?? ''}`.toUpperCase()
})

const rolLabel = computed(() => {
  switch (usuario.value?.rol) {
    case 'tecnico':
      return 'Técnico'
    case 'admin':
      return 'Administrador'
    default:
      return 'Cliente'
  }
})

const menu = computed(() => {
  const filas: { label: string; icon: string; ruta: string }[] = [
    { label: 'Inicio', icon: 'pi pi-home', ruta: '/' },
  ]
  if (hasAnyRole('cliente')) {
    filas.push({ label: 'Mis solicitudes', icon: 'pi pi-list-check', ruta: '/solicitudes' })
  }
  if (hasAnyRole('tecnico')) {
    filas.push({ label: 'Mi perfil', icon: 'pi pi-user', ruta: '/perfil' })
    filas.push({ label: 'Mi disponibilidad', icon: 'pi pi-clock', ruta: '/disponibilidad' })
    filas.push({ label: 'Mis certificaciones', icon: 'pi pi-id-card', ruta: '/certificaciones' })
  }
  if (hasAnyRole('cliente', 'tecnico', 'admin')) {
    filas.push({ label: 'Mis direcciones', icon: 'pi pi-map-marker', ruta: '/direcciones' })
  }
  if (hasAnyRole('admin')) {
    filas.push({ label: 'Categorías', icon: 'pi pi-tags', ruta: '/categorias' })
    filas.push({ label: 'Tarifas', icon: 'pi pi-dollar', ruta: '/tarifas' })
    filas.push({ label: 'Usuarios', icon: 'pi pi-users', ruta: '/usuarios' })
    filas.push({ label: 'Técnicos', icon: 'pi pi-wrench', ruta: '/tecnicos' })
  }
  return filas
})

function navegar(ruta: string) {
  visible.value = false
  if (ruta === router.currentRoute.value.path) return
  router.push(ruta).catch(() => {})
}

function logout() {
  visible.value = false
  cerrarSesion()
  router.push('/login')
}
</script>

<template>
  <div>
    <header
      class="sticky top-0 z-40 flex h-15 items-center gap-3 border-b border-pacific/10 bg-card/95 px-3 py-3 backdrop-blur sm:h-16 sm:px-6"
    >
      <Button icon="pi pi-bars" text rounded aria-label="Abrir menú" @click="visible = true" />

      <button class="flex items-center gap-2 border-0 bg-transparent" @click="navegar('/')">
        <img src="/faviconcamello.png" alt="CamelloApp" class="h-8 w-8" />
        <span class="hidden text-lg font-semibold tracking-tight text-pacific sm:inline">CamelloApp</span>
      </button>

      <div class="flex-1" />

      <div class="flex items-center gap-2 sm:gap-3">
        <div class="hidden text-right sm:block">
          <p class="text-sm font-medium leading-tight text-ink">
            {{ usuario?.nombres }} {{ usuario?.apellidos }}
          </p>
          <p class="text-xs leading-tight text-muted">{{ rolLabel }}</p>
        </div>
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-pacific text-sm font-semibold text-white"
        >
          {{ iniciales }}
        </div>
      </div>
    </header>

    <Drawer v-model:visible="visible" position="left" show-close-icon>
      <template #header>
        <div class="flex items-center gap-2 py-1">
          <img src="/faviconcamello.png" alt="CamelloApp" class="h-9 w-9" />
          <span class="text-xl font-semibold text-pacific">CamelloApp</span>
        </div>
      </template>

      <div class="flex h-full flex-col">
        <div class="mb-6 rounded-xl bg-pacific/5 p-4">
          <p class="text-sm font-semibold text-ink">{{ usuario?.nombres }} {{ usuario?.apellidos }}</p>
          <p class="mt-0.5 truncate text-xs text-muted">{{ usuario?.email }}</p>
          <span
            class="mt-3 inline-block rounded-full bg-pacific px-2.5 py-0.5 text-xs font-medium text-white"
          >
            {{ rolLabel }}
          </span>
        </div>

        <nav class="flex flex-1 flex-col gap-1">
          <button
            v-for="item in menu"
            :key="item.ruta"
            type="button"
            class="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-ink transition-colors hover:bg-pacific/10 hover:text-pacific"
            @click="navegar(item.ruta)"
          >
            <i :class="item.icon" class="w-5 text-pacific" />
            {{ item.label }}
          </button>
        </nav>

        <div
          class="mb-3 mt-auto flex items-center justify-between rounded-xl border border-pacific/10 px-3 py-2.5"
        >
          <span class="flex items-center gap-3 text-sm font-medium text-ink">
            <i :class="isDark ? 'pi pi-moon' : 'pi pi-sun'" class="w-5 text-pacific" />
            {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
          </span>
          <ToggleSwitch :model-value="isDark" @update:model-value="toggle" aria-label="Cambiar modo oscuro" />
        </div>

        <div class="pt-4">
          <Button
            label="Cerrar sesión"
            icon="pi pi-sign-out"
            severity="warn"
            variant="outlined"
            class="w-full"
            @click="logout"
          />
        </div>
      </div>
    </Drawer>
  </div>
</template>