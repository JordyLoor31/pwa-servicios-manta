import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'
import router from './router'
import { MantaPreset } from './theme/preset'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: MantaPreset,
  },
})
app.use(ToastService)

app.mount('#app')