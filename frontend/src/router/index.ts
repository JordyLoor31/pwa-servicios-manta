import { createRouter, createWebHistory } from 'vue-router'
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
    { path: '/', name: 'home', component: () => import('../views/home/HomeView.vue') },
    { path: '/perfil', name: 'perfil', component: () => import('../views/perfil/PerfilTecnicoView.vue'), meta: { roles: ['tecnico'] } },
    { path: '/categorias', name: 'categorias', component: () => import('../views/admin/CategoriasView.vue'), meta: { roles: ['admin'] } },
    { path: '/usuarios', name: 'usuarios', component: () => import('../views/admin/UsuariosView.vue'), meta: { roles: ['admin'] } },
    { path: '/tecnicos', name: 'tecnicos', component: () => import('../views/admin/TecnicosView.vue'), meta: { roles: ['admin'] } },
    {
      path: '/direcciones',
      name: 'direcciones',
      component: () => import('../views/direcciones/MisDireccionesView.vue'),
      meta: { roles: ['cliente', 'tecnico', 'admin'] },
    },
    {
      path: '/disponibilidad',
      name: 'disponibilidad',
      component: () => import('../views/disponibilidad/MiDisponibilidadView.vue'),
      meta: { roles: ['tecnico'] },
    },
    {
      path: '/solicitudes',
      name: 'solicitudes',
      component: () => import('../views/solicitudes/MisSolicitudesView.vue'),
      meta: { roles: ['cliente'] },
    },
    {
      path: '/solicitudes/recibidas',
      name: 'solicitudes-recibidas',
      component: () => import('../views/solicitudes/SolicitudesRecibidasView.vue'),
      meta: { roles: ['tecnico'] },
    },
    {
      path: '/certificaciones',
      name: 'certificaciones',
      component: () => import('../views/certificaciones/MisCertificacionesView.vue'),
      meta: { roles: ['tecnico'] },
    },
    { path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue'), meta: { publica: true } },
    { path: '/registro', name: 'registro', component: () => import('../views/auth/RegisterView.vue'), meta: { publica: true } },
    { path: '/recuperar', name: 'recuperar', component: () => import('../views/auth/RecuperarPasswordView.vue'), meta: { publica: true } },
    { path: '/resetear', name: 'resetear', component: () => import('../views/auth/ResetPasswordView.vue'), meta: { publica: true } },
    {
      path: '/cuenta',
      name: 'cuenta',
      component: () => import('../views/auth/MiCuentaView.vue'),
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