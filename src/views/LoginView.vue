<template>
  <div class="main-container">
    <div class="row g-0">
      <!-- Phần giới thiệu (8 cột) -->
      <div class="col-lg-8">
        <div class="intro-section">
          <div class="intro-header">
            <h1>
              <i class="fas fa-building me-3"></i>Hệ thống kế toán
            </h1>
            <p>
              Giải pháp toàn diện cho quản lý kế toán theo TT88
            </p>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-calculator"></i>
                </div>
                <div class="feature-title">Kế toán tự động</div>
                <div class="feature-desc">
                  Quản lý thu chi, lập báo cáo tài chính, theo dõi công nợ và
                  thanh toán tự động. Đồng bộ dữ liệu thời gian thực.
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="feature-card">
                <div class="feature-icon">
                 <i class="fas fa-money-bill"></i>
                </div>
                <div class="feature-title">Quản lý thu chi</div>
                <div class="feature-desc">
                  Quản lý chứng từ thu chi, hóa đơn, phiếu thu/chi. Tự động
                  ghi nhận và phân loại giao dịch.
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-tools"></i>
                </div>
                <div class="feature-title">Bảo trì & Sửa chữa</div>
                <div class="feature-desc">
                  Tiếp nhận yêu cầu, phân công công việc, theo dõi tiến độ và
                  quản lý chi phí bảo trì hiệu quả.
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="feature-title">Báo cáo & Thống kê</div>
                <div class="feature-desc">
                  Báo cáo chi tiết về tài chính, công nợ, doanh thu. Biểu đồ
                  trực quan, xuất Excel với một cú click.
                </div>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <span class="stat-number">500+</span>
              <span class="stat-label">Đơn vị tin dùng</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">99.9%</span>
              <span class="stat-label">Thời gian hoạt động</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Hỗ trợ kỹ thuật</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phần đăng nhập (4 cột) -->
      <div class="col-lg-4">
        <div class="login-section">
          <div class="login-header">
            <i class="fas fa-lock"></i>
            <h3>Đăng nhập</h3>
            <p>Truy cập hệ thống quản lý</p>
          </div>

          <form id="loginForm">
            <div class="mb-3">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  class="form-control"
                  id="username"
                  placeholder="Nhập tài khoản"
                  v-model="taikhoan"
                />
              </div>
            </div>

            <div class="mb-3">
              <div class="password-wrapper">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    placeholder="Nhập mật khẩu"
                    v-model="password"
                  />
                </div>
                <i
                  class="fas fa-eye show-password-toggle"
                  id="togglePassword"
                ></i>
              </div>
            </div>

            <button
              type="button"
              @click="dangNhapHeThong"
              class="btn btn-login"
            >
              <i class="fas fa-sign-in-alt me-2"></i> Đăng nhập
            </button>
            <div class="forgot-password">
              <a href="#" id="forgotPasswordLink">
                <i class="fas fa-key me-1"></i> Quên mật khẩu?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import '@/assets/login.css'
import useJwt from '@/core/useJwt'
import { useStore } from '../core/store'
import { heThong } from '../core/api'

const router = useRouter()

const taikhoan = ref('')
const password = ref('')
const authStore = useStore()

onMounted(() => {
  localStorage.clear()
})

const dangNhapHeThong = async () => {
  if (!taikhoan.value || !password.value) {
    showError('nhập thông tin tài khoản và mật khẩu')
    return
  }
  var body = {
    taikhoan: taikhoan.value,
    matkhau: password.value
  }
  router.push({ name: 'home' })
}
</script>
