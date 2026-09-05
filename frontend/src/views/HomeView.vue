<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

interface StoredUser {
  id: string
  nombres: string
  apellidos: string
  email: string
  rol: string
}

const router = useRouter()
const user = computed<StoredUser | null>(() => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
})

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-ink">
        Hola, {{ user?.nombres }} {{ user?.apellidos }}
      </h1>
      <p class="text-muted mt-1">You are logged in as {{ user?.email }}</p>
    </div>
    <Button label="Cerrar sesión" severity="secondary" variant="outlined" @click="logout" />
  </div>
</template>