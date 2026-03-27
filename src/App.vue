<template>
  <div class="d-flex flex-column min-vh-100" style="width: 100% !important;">
    <!-- Ẩn NavBar ở trang login -->
    <NavBar v-if="route.name !== 'login'" />

    <!-- Layout cho trang Login: form giữa màn hình -->
    <main v-if="route.name === 'login'" class="align-items-center justify-content-center bg-light w-100">
      <div class="container">
        <RouterView />
      </div>
    </main>

    <!-- Layout cho các trang khác -->
    <main v-else>
      <MenuLeft></MenuLeft>
      <div class="main-content" v-cloak>
        <RouterView />
      </div>
      <Footer></Footer>
    </main>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import MenuLeft from './components/MenuLeft.vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.app-wrapper {
  background-color: #f8f9fa;
}
</style>
