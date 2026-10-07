<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import AppInstallPrompt from './AppInstallPrompt.vue'
import AppThemeToggle from './AppThemeToggle.vue'
import AppProgressSpinner from './AppProgressSpinner.vue'
import AppBreadcrumb from './AppBreadcrumb.vue'
import Popover from 'primevue/popover'
import Dialog from 'primevue/dialog'
import { useTheme } from '../../composables/useTheme'
import { useAuthz, cerrarSesion } from '../../composables/auth/useAuthz'
import { usarNotificaciones, limpiarNotificacionesNuevas, type Notificacion } from '../../composables/notificaciones/useNotificaciones'
import { usePWAInstall } from '../../composables/usePWAInstall'

const router = useRouter()
const visible = ref(false)
const saliendo = ref(false)
const { isDark, toggle } = useTheme()
const { usuario, hasAnyRole } = useAuthz()
const { solicitudesNuevas, notificaciones, marcarComoLeida, marcarTodasComoLeidas } = usarNotificaciones()
const { canInstall, isIOS, showIosHint, promptInstall } = usePWAInstall()

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
const notificacionSeleccionada = ref<Notificacion | null>(null)
const detalleNotificacionVisible = ref(false)

function togglePopover(event: MouseEvent) {
  popoverRef.value?.toggle(event)
}

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
  if (hasAnyRole('cliente', 'tecnico', 'admin')) {
    filas.push({ label: 'Mi cuenta', icon: 'pi pi-user', ruta: '/cuenta' })
  }
  if (hasAnyRole('cliente')) {
    filas.push({ label: 'Mis solicitudes', icon: 'pi pi-list-check', ruta: '/solicitudes' })
  }
  if (hasAnyRole('tecnico')) {
    filas.push({ label: 'Solicitudes recibidas', icon: 'pi pi-inbox', ruta: '/solicitudes/recibidas' })
    filas.push({ label: 'Mi disponibilidad', icon: 'pi pi-clock', ruta: '/disponibilidad' })
    filas.push({ label: 'Mis certificaciones', icon: 'pi pi-id-card', ruta: '/certificaciones' })
  }
  if (hasAnyRole('cliente', 'tecnico', 'admin')) {
    filas.push({ label: 'Mis direcciones', icon: 'pi pi-map-marker', ruta: '/direcciones' })
  }
  if (hasAnyRole('admin')) {
    filas.push({ label: 'Categorías', icon: 'pi pi-tags', ruta: '/categorias' })
    filas.push({ label: 'Usuarios', icon: 'pi pi-users', ruta: '/usuarios' })
    filas.push({ label: 'Técnicos', icon: 'pi pi-wrench', ruta: '/tecnicos' })
  }
  return filas
})

function navegar(ruta: string) {
  visible.value = false
  if (ruta === router.currentRoute.value.path) return
  void router.push(ruta)
}

function irARecibidas() {
  limpiarNotificacionesNuevas()
  if (router.currentRoute.value.path !== '/solicitudes/recibidas') {
    void router.push('/solicitudes/recibidas')
  }
}

function irANotificacion(notif: Notificacion) {
  marcarComoLeida(notif.id)
  notificacionSeleccionada.value = notif
  detalleNotificacionVisible.value = true
  popoverRef.value?.hide()
}

function logout() {
  visible.value = false
  saliendo.value = true
  cerrarSesion()
  router.push('/login')
}
</script>

<template>
  <div>
    <div v-if="saliendo" class="fixed inset-0 z-[60] flex items-center justify-center bg-white/80">
      <AppProgressSpinner />
    </div>
    <header
      class="sticky top-0 z-40 flex h-15 items-center gap-3 border-b border-pacific/10 bg-card/95 px-3 py-3 backdrop-blur sm:h-16 sm:px-6"
    >
      <Button icon="pi pi-bars" text rounded aria-label="Abrir menú" @click="visible = true" />

      <button class="flex items-center gap-2 border-0 bg-transparent" @click="navegar('/')">
        <img src="/faviconcamello.png" alt="CamelloApp" class="h-8 w-8" />
        <span class="hidden text-lg font-semibold tracking-tight text-pacific sm:inline">CamelloApp</span>
      </button>

      <AppBreadcrumb class="flex-1 min-w-0" />

      <div class="flex items-center gap-2 sm:gap-3">
        <Button
          v-if="hasAnyRole('cliente', 'tecnico', 'admin')"
          icon="pi pi-bell"
          text
          rounded
          aria-label="Notificaciones de solicitudes"
          class="relative"
          @click="togglePopover"
        >
          <span
            v-if="solicitudesNuevas > 0"
            class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
          >
            {{ solicitudesNuevas > 9 ? '9+' : solicitudesNuevas }}
          </span>
        </Button>

        <Popover ref="popoverRef" v-if="hasAnyRole('cliente', 'tecnico', 'admin')" appendTo="self" :dismissable="true">
          <div class="w-80 p-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-ink">Notificaciones</h3>
                <Button
                  v-if="solicitudesNuevas > 0"
                  label="Marcar todas como leídas"
                  text
                  size="small"
                  class="p-0 text-xs"
                  @click="marcarTodasComoLeidas"
                />
              </div>
              <div class="max-h-60 overflow-y-auto">
                <div
                  v-if="notificaciones.length === 0"
                  class="py-4 text-center text-sm text-muted"
                >
                  Sin notificaciones
                </div>
                <div
                  v-else
                  v-for="notif in notificaciones"
                  :key="notif.id"
                  class="relative p-3 hover:bg-pacific/5 rounded-lg cursor-pointer border-b border-pacific/10 last:border-0"
                  @click="irANotificacion(notif)"
                >
                  <div class="flex items-start gap-2">
                    <div
                      :class="[
                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                        notif.tipo === 'solicitud.nueva' ? 'bg-pacific/10 text-pacific' : 'bg-amber/10 text-amber',
                      ]"
                    >
                      <i
                        :class="notif.tipo === 'solicitud.nueva' ? 'pi pi-plus' : 'pi pi-sync'"
                        class="text-sm"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-ink" :class="{ 'line-through text-muted': notif.leida }">
                        {{ notif.titulo }}
                      </p>
                      <p class="text-xs text-muted truncate">{{ notif.mensaje }}</p>
                      <p class="mt-1 text-[10px] text-muted">{{ notif.fecha.toLocaleTimeString() }}</p>
                    </div>
                    <div
                      v-if="!notif.leida"
                      class="flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-pacific"
                    />
                  </div>
                </div>
              </div>
              <div class="mt-2 text-center">
                <Button
                  label="Ver todas"
                  text
                  size="small"
                  @click="irARecibidas"
                />
              </div>
          </div>
        </Popover>
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

        <div class="mt-auto flex flex-col gap-2">
          <AppInstallPrompt
            :can-install="canInstall"
            :is-i-o-s="isIOS"
            :show-ios-hint="showIosHint"
            @install="promptInstall"
          />
          <AppThemeToggle :is-dark="isDark" @toggle="toggle" />
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

    <Dialog
      v-model:visible="detalleNotificacionVisible"
      modal
      header="Detalle de notificación"
      :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    >
      <div v-if="notificacionSeleccionada" class="flex flex-col gap-4">
        <div class="flex items-start gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber">
            <i class="pi pi-bell text-lg" />
          </div>
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-ink">{{ notificacionSeleccionada.titulo }}</h2>
            <p class="mt-1 text-xs text-muted">{{ notificacionSeleccionada.fecha.toLocaleString() }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-pacific/15 bg-pacific/5 p-4">
          <p class="whitespace-pre-wrap break-words text-sm leading-6 text-ink">
            {{ notificacionSeleccionada.mensaje }}
          </p>
        </div>
        <Button
          v-if="notificacionSeleccionada.solicitudId"
          label="Ver solicitud"
          icon="pi pi-arrow-right"
          class="self-end"
          @click="detalleNotificacionVisible = false; void router.push(`/solicitudes/${notificacionSeleccionada?.solicitudId}`)"
        />
      </div>
    </Dialog>
  </div>
</template>