<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="error-box text-center p-4 bg-white rounded-4 shadow">
      <div class="error-code">404</div>
      <h4 class="mt-3 mb-2">Đường dẫn không tồn tại</h4>
      <p class="text-muted">
        Có vẻ như bạn đang truy cập một địa chỉ không hợp lệ hoặc đã bị xoá.
      </p>

      <router-link to="/home" class="btn btn-primary btn-home">
        ← Quay về trang chủ
      </router-link>
    </div>
  </div>
</template>

<script setup>
// component không cần script thêm
</script>

<style scoped>
.error-box {
  max-width: 450px;
}

.error-code {
  font-size: 80px;
  font-weight: 700;
  color: #dc3545;
}

.btn-home {
  padding: 10px 25px;
  font-size: 16px;
}
</style>
