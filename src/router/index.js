import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import AboutView from '@/views/AboutView.vue'
import NotFound from '@/views/page/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/DanhMuc/MaTaiKhoan',
    name: 'MaTaiKhoan',
    component: () => import('@/views/danhmuc/MaTaiKhoan.vue'),
  },
  {
    path: '/KeToan/PhieuThu',
    name: 'PhieuThu',
    component: () => import('@/views/KeToan/PhieuThu.vue'),
  },
  // Route mặc định cho các đường dẫn không tồn tại
  { path: '/:pathMatch(.*)*', name: 'page/NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
