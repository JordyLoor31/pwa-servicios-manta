import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import RecuperarPasswordView from '../views/auth/RecuperarPasswordView.vue'
import ResetPasswordView from '../views/auth/ResetPasswordView.vue'
import MiCuentaView from '../views/auth/MiCuentaView.vue'
import HomeView from '../views/home/HomeView.vue'
import PerfilTecnicoView from '../views/perfil/PerfilTecnicoView.vue'
import CategoriasView from '../views/admin/CategoriasView.vue'
import UsuariosView from '../views/admin/UsuariosView.vue'
import TecnicosView from '../views/admin/TecnicosView.vue'
import MisDireccionesView from '../views/direcciones/MisDireccionesView.vue'
import MiDisponibilidadView from '../views/disponibilidad/MiDisponibilidadView.vue'
import MisCertificacionesView from '../views/certificaciones/MisCertificacionesView.vue'
import MisSolicitudesView from '../views/solicitudes/MisSolicitudesView.vue'
import SolicitudesRecibidasView from '../views/solicitudes/SolicitudesRecibidasView.vue'
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
    { path: '/categorias', name: 'categorias', component: CategoriasView, meta: { roles: ['admin'] } },
    { path: '/usuarios', name: 'usuarios', component: UsuariosView, meta: { roles: ['admin'] } },
    { path: '/tecnicos', name: 'tecnicos', component: TecnicosView, meta: { roles: ['admin'] } },
    {
      path: '/direcciones',
      name: 'direcciones',
      component: MisDireccionesView,
      meta: { roles: ['cliente', 'tecnico', 'admin'] },
    },
    {
      path: '/disponibilidad',
      name: 'disponibilidad',
      component: MiDisponibilidadView,
      meta: { roles: ['tecnico'] },
    },
    {
      path: '/solicitudes',
      name: 'solicitudes',
      component: MisSolicitudesView,
      meta: { roles: ['cliente'] },
    },
    {
      path: '/solicitudes/recibidas',
      name: 'solicitudes-recibidas',
      component: SolicitudesRecibidasView,
      meta: { roles: ['tecnico'] },
    },
    {
      path: '/certificaciones',
      name: 'certificaciones',
      component: MisCertificacionesView,
      meta: { roles: ['tecnico'] },
    },
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
    { path: '/registro', name: 'registro', component: RegisterView, meta: { publica: true } },
    { path: '/recuperar', name: 'recuperar', component: RecuperarPasswordView, meta: { publica: true } },
    { path: '/resetear', name: 'resetear', component: ResetPasswordView, meta: { publica: true } },
    {
      path: '/cuenta',
      name: 'cuenta',
      component: MiCuentaView,
      meta: { roles: ['cliente', 'tecnico', 'admin'] },
    },
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