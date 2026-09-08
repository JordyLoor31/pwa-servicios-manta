<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import AppHeader from '../../components/layout/AppHeader.vue'
import { useUsuariosAdmin } from '../../composables/usuarios/useUsuariosAdmin'
import type { UsuarioLista } from '../../types/usuarios'

const {
  usuarios,
  total,
  page,
  limit,
  cargando,
  cambiandoEstado,
  usuarioActivo,
  detalleVisible,
  confirmarEstadoVisible,
  busqueda,
  cargar,
  onPage,
  onCambioBusqueda,
  limpiarBusqueda,
  abrirVer,
  confirmarCambiarEstado,
  cambiarEstado,
} = useUsuariosAdmin()

const placeholders = ref(Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` })))

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const filas = computed(() => (cargando.value ? placeholders.value : usuarios.value))

const etiquetasRol: Record<'admin' | 'tecnico' | 'cliente', { label: string; icono: string; severidad: string }> = {
  admin: { label: 'Administrador', icono: 'pi pi-shield', severidad: 'contrast' },
  tecnico: { label: 'Técnico', icono: 'pi pi-wrench', severidad: 'info' },
  cliente: { label: 'Cliente', icono: 'pi pi-user', severidad: 'secondary' },
}

function severidadEstado(estado: string) {
  if (estado === 'activo') return 'success'
  if (estado === 'suspendido') return 'danger'
  return 'secondary'
}

const opciones = computed(() => {
  const usuario = usuarioActivo.value
  if (!usuario) return []
  const suspendido = usuario.estado === 'suspendido'
  const acciones = [
    { label: 'Ver', icon: 'pi pi-eye', command: () => abrirVer(usuario) },
    {
      label: suspendido ? 'Activar' : 'Suspender',
      icon: suspendido ? 'pi pi-check-circle' : 'pi pi-pause-circle',
      class: suspendido ? '' : 'text-red-500',
      command: () => confirmarCambiarEstado(usuario),
    },
  ]
  return acciones
})

function abrirMenu(event: Event, usuario: UsuarioLista) {
  usuarioActivo.value = usuario
  menuRef.value?.toggle(event)
}

function etiquetaFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
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
            <h1 class="text-2xl font-semibold text-ink">Gestión de usuarios</h1>
            <p class="mt-1 text-sm text-muted">Consulta todos los usuarios registrados en la plataforma.</p>
          </div>
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            variant="outlined"
            :disabled="cargando"
            @click="cargar"
          />
        </div>

        <div class="mb-4">
          <div class="relative w-full max-w-sm">
            <i class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-muted" />
            <InputText
              v-model="busqueda"
              placeholder="Buscar por nombre, apellido o correo..."
              class="w-full !pl-9"
              @input="onCambioBusqueda(($event.target as HTMLInputElement).value)"
            />
            <Button
              v-if="busqueda"
              icon="pi pi-times"
              text
              rounded
              aria-label="Limpiar búsqueda"
              class="absolute right-1 top-1/2 z-10 -translate-y-1/2"
              @click="limpiarBusqueda"
            />
          </div>
        </div>

      <div class="rounded-2xl border border-pacific/10 bg-card p-4 shadow-sm sm:p-5">
        <DataTable
          :value="filas"
          lazy
          paginator
          :rows="limit"
          :first="(page - 1) * limit"
          :total-records="total"
          :rows-per-page-options="[5, 10, 20]"
          :current-page-report-template="'Mostrando {first}-{last} de {totalRecords}'"
          paginator-template="FirstPageLink PrevPageLink PageLinks CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
          table-style="min-width: 42rem"
          class="w-full"
          @page="onPage"
        >
          <Column header="Nombres" class="w-1/4">
            <template #body="{ data }">
              <template v-if="cargando">
                <div class="flex items-center gap-3">
                  <Skeleton shape="circle" size="2.5rem" />
                  <Skeleton width="8rem" height="0.8rem" />
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pacific text-sm font-semibold text-white"
                  >
                    {{ `${data.nombres?.[0] ?? ''}${data.apellidos?.[0] ?? ''}`.toUpperCase() }}
                  </div>
                  <span class="font-medium text-ink">{{ data.nombres }} {{ data.apellidos }}</span>
                </div>
              </template>
            </template>
          </Column>
          <Column header="Correo" class="w-1/4">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="12rem" height="0.8rem" />
              <span v-else class="text-sm text-ink">{{ data.email }}</span>
            </template>
          </Column>
          <Column header="Tipo de usuario" style="width: 12rem">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="8rem" height="1.5rem" />
              <Tag
                v-else
                :value="etiquetasRol[data.rol as 'admin' | 'tecnico' | 'cliente'].label"
                :icon="etiquetasRol[data.rol as 'admin' | 'tecnico' | 'cliente'].icono"
                :severity="etiquetasRol[data.rol as 'admin' | 'tecnico' | 'cliente'].severidad"
              />
            </template>
          </Column>
          <Column header="Estado" style="width: 10rem">
            <template #body="{ data }">
              <Skeleton v-if="cargando" width="6rem" height="1.5rem" />
              <Tag v-else :value="data.estado" :severity="severidadEstado(data.estado)" />
            </template>
          </Column>
          <Column header="Acciones" style="width: 6rem" body-class="text-center">
            <template #body="{ data }">
              <Button
                v-if="!cargando"
                icon="pi pi-ellipsis-v"
                text
                rounded
                aria-label="Acciones"
                @click="abrirMenu($event, data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center gap-2 py-8 text-center">
              <i class="pi pi-users text-3xl text-muted" />
              <p class="text-sm text-muted">
                {{ busqueda ? 'No se encontraron usuarios para tu búsqueda.' : 'Aún no hay usuarios registrados.' }}
              </p>
            </div>
          </template>
        </DataTable>
      </div>

      <Menu ref="menuRef" :model="opciones" popup />

      <Dialog v-model:visible="detalleVisible" header="Detalle del usuario" modal class="w-full max-w-md">
        <div v-if="usuarioActivo" class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pacific text-lg font-semibold text-white"
            >
              {{ `${usuarioActivo.nombres?.[0] ?? ''}${usuarioActivo.apellidos?.[0] ?? ''}`.toUpperCase() }}
            </div>
            <div>
              <p class="text-lg font-semibold text-ink">
                {{ usuarioActivo.nombres }} {{ usuarioActivo.apellidos }}
              </p>
              <Tag
                :value="etiquetasRol[usuarioActivo.rol as 'admin' | 'tecnico' | 'cliente'].label"
                :icon="etiquetasRol[usuarioActivo.rol as 'admin' | 'tecnico' | 'cliente'].icono"
                :severity="etiquetasRol[usuarioActivo.rol as 'admin' | 'tecnico' | 'cliente'].severidad"
              />
            </div>
          </div>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-muted">Correo</dt>
            <dd class="text-ink">{{ usuarioActivo.email }}</dd>
            <dt class="text-muted">Teléfono</dt>
            <dd class="text-ink">{{ usuarioActivo.telefono || '—' }}</dd>
            <dt class="text-muted">Estado</dt>
            <dd>
              <Tag :value="usuarioActivo.estado" :severity="severidadEstado(usuarioActivo.estado)" />
            </dd>
            <dt class="text-muted">Registro</dt>
            <dd class="text-ink">{{ etiquetaFecha(usuarioActivo.fecha_registro) }}</dd>
          </dl>
        </div>
        <template #footer>
          <Button label="Cerrar" severity="secondary" @click="detalleVisible = false" />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="confirmarEstadoVisible"
        :header="usuarioActivo?.estado === 'suspendido' ? 'Activar usuario' : 'Suspender usuario'"
        modal
        class="w-full max-w-sm"
      >
        <p class="text-sm text-ink">
          <template v-if="usuarioActivo?.estado === 'suspendido'">
            ¿Deseas activar la cuenta de
            <span class="font-semibold">{{ usuarioActivo?.nombres }}</span
            >?
          </template>
          <template v-else>
            ¿Deseas suspender la cuenta de
            <span class="font-semibold">{{ usuarioActivo?.nombres }}</span
            >? No podrá iniciar sesión mientras esté suspendida.
          </template>
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="confirmarEstadoVisible = false" />
            <Button
              :label="usuarioActivo?.estado === 'suspendido' ? 'Activar' : 'Suspender'"
              :icon="usuarioActivo?.estado === 'suspendido' ? 'pi pi-check-circle' : 'pi pi-pause-circle'"
              :severity="usuarioActivo?.estado === 'suspendido' ? 'success' : 'danger'"
              :loading="cambiandoEstado"
              @click="cambiarEstado"
            />
          </div>
        </template>
      </Dialog>
    </section>
  </div>
</template>