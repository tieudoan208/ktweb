<template>
  <!-- Page Header -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="h3 mb-0">Dashboard</h1>
      <p class="text-muted">Tổng quan hệ thống</p>
    </div>
    <div>
    </div>
  </div>

  <!-- Statistics Cards -->
  <div class="row mb-4">
    <div class="col-xl-3 col-md-6 mb-3">
      <div class="stats-card orders-sent">
        <div class="row align-items-center">
          <div class="col-8">
            <h2 class="stats-number text-info">1,234</h2>
            <p class="stats-label">Tổng đơn hàng gửi báo giá</p>
            <span class="stats-change positive">
              <i class="fas fa-arrow-up"></i> +12.5% so với hôm qua
            </span>
          </div>
          <div class="col-4 text-end">
            <i class="fas fa-paper-plane stats-icon text-info"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-3">
      <div class="stats-card orders-confirmed">
        <div class="row align-items-center">
          <div class="col-8">
            <h2 class="stats-number text-warning">856</h2>
            <p class="stats-label">Tổng đơn hàng gửi mua Nhà cung cấp</p>
            <span class="stats-change positive">
              <i class="fas fa-arrow-up"></i> +8.3% so với hôm qua
            </span>
          </div>
          <div class="col-4 text-end">
            <i class="fas fa-check-circle stats-icon text-warning"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-3">
      <div class="stats-card orders-paid">
        <div class="row align-items-center">
          <div class="col-8">
            <h2 class="stats-number text-success">642</h2>
            <p class="stats-label">Tổng đơn hàng nhận về kho</p>
            <span class="stats-change negative">
              <i class="fas fa-arrow-down"></i> -2.1% so với hôm qua
            </span>
          </div>
          <div class="col-4 text-end">
            <i class="fas fa-credit-card stats-icon text-success"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-3">
      <div class="stats-card orders-total">
        <div class="row align-items-center">
          <div class="col-8">
            <h2 class="stats-number text-purple">2,732</h2>
            <p class="stats-label">Tổng đơn hàng gửi khách hàng</p>
            <span class="stats-change positive">
              <i class="fas fa-arrow-up"></i> +15.7% so với hôm qua
            </span>
          </div>
          <div class="col-4 text-end">
            <i class="fas fa-shopping-cart stats-icon" style="color: #6f42c1;"></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="row mb-4">
    <div class="col-lg-6 mb-3">
      <div class="chart-container">
        <h5 class="mb-3">
          <i class="fas fa-chart-pie me-2 text-primary"></i>
          Bản đồ thu chi
        </h5>
        <canvas id="revenueChart"></canvas>
      </div>
    </div>

    <div class="col-lg-6 mb-3">
      <div class="chart-container">
        <h5 class="mb-3">
          <i class="fas fa-chart-bar me-2 text-success"></i>
          Tình hình đặt hàng, giao hàng, thanh toán
        </h5>
        <canvas id="orderStatusChart"></canvas>
      </div>
    </div>
  </div>

  <!-- Recent Orders -->
  <div class="row">
    <div class="col-12">
      <div class="recent-orders">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">
            <i class="fas fa-list me-2 text-info"></i>
            Đơn hàng gần nhất
          </h5>
          <a href="#" class="btn btn-outline-primary btn-sm">
            <i class="fas fa-eye me-1"></i>Xem tất cả
          </a>
        </div>

        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr class="order-item">
                <td><strong>#DH001234</strong></td>
                <td>
                  <div>
                    <strong>Nguyễn Văn A</strong><br>
                    <small class="text-muted">0901234567</small>
                  </div>
                </td>
                <td>15/08/2025<br><small class="text-muted">09:30</small></td>
                <td><strong class="text-success">2,500,000 ₫</strong></td>
                <td><span class="status-badge status-confirmed">Đã xác nhận</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
              <tr class="order-item">
                <td><strong>#DH001235</strong></td>
                <td>
                  <div>
                    <strong>Trần Thị B</strong><br>
                    <small class="text-muted">0912345678</small>
                  </div>
                </td>
                <td>15/08/2025<br><small class="text-muted">08:15</small></td>
                <td><strong class="text-success">1,800,000 ₫</strong></td>
                <td><span class="status-badge status-paid">Đã thanh toán</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
              <tr class="order-item">
                <td><strong>#DH001236</strong></td>
                <td>
                  <div>
                    <strong>Lê Văn C</strong><br>
                    <small class="text-muted">0923456789</small>
                  </div>
                </td>
                <td>14/08/2025<br><small class="text-muted">16:45</small></td>
                <td><strong class="text-success">3,200,000 ₫</strong></td>
                <td><span class="status-badge status-pending">Chờ xác nhận</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
              <tr class="order-item">
                <td><strong>#DH001237</strong></td>
                <td>
                  <div>
                    <strong>Phạm Thị D</strong><br>
                    <small class="text-muted">0934567890</small>
                  </div>
                </td>
                <td>14/08/2025<br><small class="text-muted">14:20</small></td>
                <td><strong class="text-success">1,500,000 ₫</strong></td>
                <td><span class="status-badge status-shipped">Đang giao</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
              <tr class="order-item">
                <td><strong>#DH001238</strong></td>
                <td>
                  <div>
                    <strong>Hoàng Văn E</strong><br>
                    <small class="text-muted">0945678901</small>
                  </div>
                </td>
                <td>14/08/2025<br><small class="text-muted">11:10</small></td>
                <td><strong class="text-success">2,100,000 ₫</strong></td>
                <td><span class="status-badge status-confirmed">Đã xác nhận</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import '@/assets/dashboard.css'
// Import Chart.js và module
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Legend
} from 'chart.js'

// đăng ký module
Chart.register(
  DoughnutController,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  BarController,
  BarElement,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend
)
import { onMounted } from 'vue'

onMounted(() => {
  // Revenue Chart (Pie Chart)
  const revenueCtx = document.getElementById('revenueChart').getContext('2d');
  const revenueChart = new Chart(revenueCtx, {
    type: 'doughnut',
    data: {
      labels: ['Thu nhập', 'Chi phí', 'Lợi nhuận'],
      datasets: [{
        data: [15000000, 8000000, 7000000],
        backgroundColor: [
          '#28a745',
          '#dc3545',
          '#17a2b8'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return context.label + ': ' + value.toLocaleString('vi-VN') + ' ₫ (' + percentage + '%)';
            }
          }
        }
      }
    }
  });

  // Order Status Chart (Bar Chart)
  const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
  const orderStatusChart = new Chart(orderStatusCtx, {
    type: 'bar',
    data: {
      labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
      datasets: [
        {
          label: 'Đặt hàng',
          data: [120, 150, 180, 200, 160, 140, 100],
          backgroundColor: '#667eea',
          borderRadius: 4
        },
        {
          label: 'Giao hàng',
          data: [100, 130, 160, 180, 140, 120, 80],
          backgroundColor: '#ffc107',
          borderRadius: 4
        },
        {
          label: 'Thanh toán',
          data: [90, 120, 150, 170, 130, 110, 70],
          backgroundColor: '#28a745',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#f8f9fa'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });

  // Auto refresh data every 5 minutes
  setInterval(function () {
    // Update statistics
    updateStatistics();
  }, 300000); // 5 minutes

  function updateStatistics() {
    // Simulate data update
    console.log('Updating statistics...');
    // In real application, you would fetch new data from server
  }

  // Add hover effects to stats cards
  document.querySelectorAll('.stats-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    });
  });
})
</script>
