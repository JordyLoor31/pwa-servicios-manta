import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import HomeView from '../views/home/HomeView.vue'
import PerfilTecnicoView from '../views/perfil/PerfilTecnicoView.vue'
import { tieneToken, leerUsuario, type RolUsuario } from '../composables/auth/useAuthz'

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
    { path: '/perfil', name: 'perfil', component: PerfilTecnicoView, meta: { roles: ['tecnico'] } },
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