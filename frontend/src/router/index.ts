import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/registro', name: 'registro', component: RegisterView },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')
  const esRutaPublica = to.name === 'login' || to.name === 'registro'

  if (token && esRutaPublica) {
    return { name: 'home' }
  }
  if (!token && !esRutaPublica) {
    return { name: 'login' }
  }
})

export default router