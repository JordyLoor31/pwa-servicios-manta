import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import { tieneToken, leerUsuario, type RolUsuario } from '../composables/useAuthz'

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean
    roles?: RolUsuario[]
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
    { path: '/registro', name: 'registro', component: RegisterView, meta: { publica: true } },
  ],
})

function tieneSesion() {
  return Boolean(tieneToken() && leerUsuario())
}

router.beforeEach((to) => {
  const esPublica = to.meta.publica === true

  if (tieneSesion() && esPublica) {
    return { name: 'home' }
  }
  if (!tieneSesion() && !esPublica) {
    return { name: 'login' }
  }

  const roles = to.meta.roles
  if (roles?.length) {
    const usuario = leerUsuario()
    if (!usuario || !roles.includes(usuario.rol)) {
      return { name: 'home' }
    }
  }
})

export default router