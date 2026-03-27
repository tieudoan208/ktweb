// API Base URL - Update this with your actual API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Hệ thống API endpoints
export const heThong = {
  API_LOGIN: `${API_BASE_URL}/auth/login`,
  API_LOGOUT: `${API_BASE_URL}/auth/logout`,
  API_CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
  API_USER_INFO: `${API_BASE_URL}/auth/user-info`
}

// Danh mục API endpoints
export const danhMuc = {
  API_DS_MATK_MOI: `${API_BASE_URL}/danhmuc/taikhoan`,
  API_TKE_LKE: `${API_BASE_URL}/danhmuc/thongke`,
  API_KHACHHANG_LKE: `${API_BASE_URL}/danhmuc/khachhang`,
  API_DOITUONG: `${API_BASE_URL}/danhmuc/doituong`,
  API_MATHONGKE: `${API_BASE_URL}/danhmuc/mathongke`
}

// Chứng từ API endpoints
export const chungTu = {
  API_LIST: `${API_BASE_URL}/chungtu/list`,
  API_CREATE: `${API_BASE_URL}/chungtu/create`,
  API_UPDATE: `${API_BASE_URL}/chungtu/update`,
  API_DELETE: `${API_BASE_URL}/chungtu/delete`,
  API_DETAIL: `${API_BASE_URL}/chungtu/detail`
}

// Báo cáo API endpoints
export const baoCao = {
  API_DOANHTHU: `${API_BASE_URL}/baocao/doanhthu`,
  API_CONGNO: `${API_BASE_URL}/baocao/congno`,
  API_TONKHO: `${API_BASE_URL}/baocao/tonkho`,
  API_SOQUY: `${API_BASE_URL}/baocao/soquy`
}

export default {
  heThong,
  danhMuc,
  chungTu,
  baoCao,
  API_BASE_URL
}

