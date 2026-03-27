<template>
  <!-- Sidebar -->
  <nav class="sidebar" style="scroll-behavior: smooth">
    <ul class="sidebar-menu">
      <li class="menu-item" v-for="p in dsMenuCha" :key="p.Id">
        <a :href="p.DuongDan" v-if="dsMenuCon(p.Id).length == 0" class="menu-link">
          <i class="fas fa-tachometer-alt menu-icon"></i>
          <span class="menu-text" v-html="p.Ten"></span>
        </a>
        <a href="#" class="menu-link" data-bs-toggle="collapse" :data-bs-target="tartget(p.Id)"
          v-on:click="chonMenuCha($event)" v-else>
          <i :class="p.Icon"></i>
          <span class="menu-text ms-1" v-html="p.Ten"></span>
          <i class="fas fa-chevron-right menu-arrow"></i>
        </a>
        <div :class="p.class" :id="tartget(p.Id)">
          <a :href="t.DuongDan" v-for="t in dsMenuCon(p.Id)" v-bind:key="t.Id" :class="t.class" :id="t.DuongDan">
            <span><i :class="t.Icon"></i><span class="nav-text ms-1" v-html="t.Ten"></span></span>
          </a>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { onMounted, reactive, ref, computed, nextTick } from 'vue'
import { useStore } from '../core/store'

const authStore = useStore()
const dsMenu = ref([])

// Dữ liệu menu test
const menuTestData = [
  // Menu cha: Danh mục
  {
    Id: '1',
    Ten: 'Danh mục',
    Icon: 'fas fa-list menu-icon',
    DuongDan: '#',
    IdCapTren: '0'
  },
  // Menu con của Danh mục
  {
    Id: '1.1',
    Ten: 'Mã tài khoản',
    Icon: 'fas fa-list-alt',
    DuongDan: '/DanhMuc/MaTaiKhoan',
    IdCapTren: '1'
  },
  {
    Id: '1.2',
    Ten: 'Khách hàng',
    Icon: 'fas fa-users',
    DuongDan: '/DanhMuc/KhachHang',
    IdCapTren: '1'
  },
  {
    Id: '1.3',
    Ten: 'Nhà cung cấp',
    Icon: 'fas fa-truck',
    DuongDan: '/danh-muc/nha-cung-cap',
    IdCapTren: '1'
  },
  {
    Id: '1.4',
    Ten: 'Sản phẩm',
    Icon: 'fas fa-box',
    DuongDan: '/danh-muc/san-pham',
    IdCapTren: '1'
  },
  {
    Id: '1.5',
    Ten: 'Kho hàng',
    Icon: 'fas fa-warehouse',
    DuongDan: '/danh-muc/kho-hang',
    IdCapTren: '1'
  },

  // Menu cha: Hệ thống
  {
    Id: '2',
    Ten: 'Hệ thống',
    Icon: 'fas fa-cog menu-icon',
    DuongDan: '#',
    IdCapTren: '0'
  },
  // Menu con của Hệ thống
  {
    Id: '2.1',
    Ten: 'Người dùng',
    Icon: 'fas fa-user',
    DuongDan: '/he-thong/nguoi-dung',
    IdCapTren: '2'
  },
  {
    Id: '2.2',
    Ten: 'Phân quyền',
    Icon: 'fas fa-user-shield',
    DuongDan: '/he-thong/phan-quyen',
    IdCapTren: '2'
  },
  {
    Id: '2.3',
    Ten: 'Cấu hình',
    Icon: 'fas fa-sliders-h',
    DuongDan: '/he-thong/cau-hinh',
    IdCapTren: '2'
  },
  {
    Id: '2.4',
    Ten: 'Nhật ký hệ thống',
    Icon: 'fas fa-history',
    DuongDan: '/he-thong/nhat-ky',
    IdCapTren: '2'
  },

  // Menu cha: Kế toán
  {
    Id: '3',
    Ten: 'Kế toán',
    Icon: 'fas fa-calculator menu-icon',
    DuongDan: '#',
    IdCapTren: '0'
  },
  // Menu con của Kế toán
  {
    Id: '3.1',
    Ten: 'Phiếu thu',
    Icon: 'fas fa-money-bill-wave',
    DuongDan: '/KeToan/PhieuThu',
    IdCapTren: '3'
  },
  {
    Id: '3.2',
    Ten: 'Phiếu chi',
    Icon: 'fas fa-hand-holding-usd',
    DuongDan: '/ke-toan/phieu-chi',
    IdCapTren: '3'
  },
  {
    Id: '3.3',
    Ten: 'Sổ quỹ',
    Icon: 'fas fa-book',
    DuongDan: '/ke-toan/so-quy',
    IdCapTren: '3'
  },
  {
    Id: '3.4',
    Ten: 'Công nợ',
    Icon: 'fas fa-file-invoice-dollar',
    DuongDan: '/ke-toan/cong-no',
    IdCapTren: '3'
  },
  {
    Id: '3.5',
    Ten: 'Báo cáo tài chính',
    Icon: 'fas fa-chart-line',
    DuongDan: '/ke-toan/bao-cao',
    IdCapTren: '3'
  }
]

onMounted(() => {
  // Sử dụng dữ liệu test nếu không có menu từ store
  if (authStore.menu == null || authStore.menu.length == 0) {
    console.warn('Sử dụng dữ liệu menu test')
    checkActveMenu(menuTestData)
  } else {
    checkActveMenu(authStore.menu)
  }

  nextTick(() => {
    const path = window.location.pathname;
    const element = document.getElementById(path);
    if (element != null) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
     });
    }
  })
})

const dsMenuCha = computed(() => {
  var menuCha = []
  if (dsMenu.value == null) return menuCha
  dsMenu.value.forEach(item => {
    if (item.IdCapTren == null || item.IdCapTren == '0') {
      var tim = dsMenu.value.findIndex(x => {
        return x.IdCapTren == item.Id && x.class == 'submenu-link active'
      })
      if (tim >= 0) {
        item.class = 'submenu collapse show'
      } else {
        item.class = 'submenu collapse'
      }
      menuCha.push(item)
    }
  })

  return menuCha
})
const dsMenuCon = Id => {
  return dsMenu.value.filter(item => item.IdCapTren == Id)
}
const tartget = Id => {
  return 'submenu_' + Id
}
const chonMenuCha = event => {
  var element = event.currentTarget
  const arrow = element.querySelector('.menu-arrow')

  const submenu = element.nextElementSibling
  if (submenu && submenu.classList.contains('submenu')) {
    submenu.classList.toggle('show')
    arrow.classList.toggle('rotate')
  }
}
const checkActveMenu = async data => {
  if (data == null || data == undefined) return
  var pathUrl = window.location.pathname
  data.forEach(v => {
    if (v.DuongDan == pathUrl) {
      v.class = 'submenu-link active'
    } else v.class = 'submenu-link'
  })
  dsMenu.value = data
}
</script>
