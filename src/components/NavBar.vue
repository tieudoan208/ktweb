<template>
  <header class="main-header">
    <div class="container-fluid">
      <!-- Company Info Row -->
      <div class="company-info">
        <div class="row align-items-center">
          <div class="col-2 col-md-1 d-md-none">
            <button class="btn btn-link text-white p-0" id="mobileMenuBtn">
              <i class="fas fa-bars fa-lg"></i>
            </button>
          </div>
          <div class="col-8 col-md-8">
            <h5 class="company-name">CÔNG TY TNHH PHẦN MỀM ABC</h5>
            <p class="company-address">
              Địa chỉ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
            </p>
          </div>
          <div class="col-2 col-md-4">
            <div
              class="d-flex align-items-center justify-content-end"
              id="userAccountTrigger"
              @click="showtaikhoan"
            >
              <div class="user-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="user-details d-none d-sm-block">
                <h6>Xin chào: Nguyễn Văn Nam</h6>
                <small>Quản trị hệ thống</small>
              </div>
              <div class="d-sm-none">
                <i class="fas fa-chevron-down ms-1"></i>
              </div>
            </div>

            <!-- User Account Popup -->
            <div
              class="user-account-popup"
              id="userAccountPopup"
              ref="userAccountPopup"
            >
              <div class="popup-header">
                <div class="popup-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <h6 class="popup-user-name">Nguyễn Văn Nam</h6>
                <p class="popup-user-role">Quản trị hệ thống</p>
              </div>
              <div class="popup-menu">
                <a href="/Home/ThongTinTK" class="popup-menu-item">
                  <i class="fas fa-user-circle"></i>
                  Thông tin cá nhân
                </a>
                <a href="/Home/DoiMatKhau" class="popup-menu-item">
                  <i class="fas fa-key"></i>
                  Đổi mật khẩu
                </a>
                <hr class="my-1" />
                <a href="#" class="popup-menu-item logout" @click="dangxuat">
                  <i class="fas fa-sign-out-alt"></i>
                  Đăng xuất
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { heThong } from '../core/api'
import { useStore } from '../core/store'
import { onMounted, ref } from 'vue'

const userAccountPopup = ref(null)
const authStore = useStore()
const router = useRouter()
const boxClick = ref(null)

const showtaikhoan = async e => {
  boxClick.value = e.target
  userAccountPopup.value.classList.toggle('show')
}

const dangxuat = async () => {
  //debugger;
  authStore.logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  boxClick.value = ''
  document.body.addEventListener('click', handleBodyClick)
})

const handleBodyClick = e => {
  // debugger;
  if (userAccountPopup.value == undefined || userAccountPopup.value == null)
    return
  if (
    boxClick.value == e.target ||
    !userAccountPopup.value.classList.contains('show')
  ) {
    return
  }

  userAccountPopup.value.classList.remove('show')
}
</script>
