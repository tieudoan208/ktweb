import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import 'bootstrap/dist/css/bootstrap.css'
import '@/assets/layout.css'
import '@/assets/grid/grid.css'
import '@/assets/grid/base.css'
import '@/assets/grid/slick-alpine-theme.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@/assets/bootstrap-dialog.css'
  
import '/public/libs/toast.js'
import '/public/libs/spinner.js'
import '/public/libs/bootstrap-dialog.js'

const pinia = createPinia()
const app = createApp(App)

app.use(router)
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.mount('#app')



