import { createRouter, createWebHistory } from 'vue-router'
import { tieneToken, leerUsuario, type RolUsuario } from '../composables/auth/useAuthz'
import { necesitaOnboarding } from '../composables/auth/useOnboarding'

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean
    roles?: RolUsuario[]
    etiqueta?: string
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/home/HomeView.vue'), meta: { publica: true } },
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
      path: '/solicitudes/:id',
      name: 'solicitud-detalle',
      component: () => import('../views/solicitudes/SolicitudDetalleView.vue'),
      meta: { roles: ['cliente', 'tecnico', 'admin'], etiqueta: 'Detalle de solicitud' },
    },
    {
      path: '/certificaciones',
      name: 'certificaciones',
      component: () => import('../views/certificaciones/MisCertificacionesView.vue'),
      meta: { roles: ['tecnico'] },
    },
    { path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue'), meta: { publica: true } },
    { path: '/registro', name: 'registro', component: () => import('../views/auth/RegisterView.vue'), meta: { publica: true } },
    {
      path: '/configuracion-inicial',
      name: 'configuracion-inicial',
      component: () => import('../views/auth/OnboardingView.vue'),
      meta: { roles: ['cliente', 'tecnico'], etiqueta: 'Configuración inicial' },
    },
    { path: '/recuperar', name: 'recuperar', component: () => import('../views/auth/RecuperarPasswordView.vue'), meta: { publica: true } },
    { path: '/resetear', name: 'resetear', component: () => import('../views/auth/ResetPasswordView.vue'), meta: { publica: true } },
    {
      path: '/cuenta',
      name: 'cuenta',
      component: () => import('../views/auth/MiCuentaView.vue'),
      meta: { roles: ['cliente', 'tecnico', 'admin'] },
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

function tieneSesion() {
  return Boolean(tieneToken() && leerUsuario())
}

router.beforeEach(async (to) => {
  const esPublica = to.meta.publica === true

  if (tieneSesion() && esPublica && to.name !== 'home') {
    return { name: 'home' }
  }
  if (!tieneSesion() && !esPublica) {
    return { name: 'login' }
  }

  const usuario = leerUsuario()
  if (
    usuario &&
    (usuario.rol === 'cliente' || usuario.rol === 'tecnico') &&
    to.name !== 'configuracion-inicial' &&
    await necesitaOnboarding(usuario)
  ) {
    return { name: 'configuracion-inicial' }
  }

  const roles = to.meta.roles
  if (roles?.length) {
    if (!usuario || !roles.includes(usuario.rol)) {
      return { name: 'home' }
    }
  }
})

export default router