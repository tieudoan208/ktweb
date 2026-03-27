import { defineStore } from 'pinia'

export const useStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    nsd: null,
    quyen: null,
    isAuthenticated: false
  }),
  
  getters: {
    getToken: (state) => state.token,
    getUser: (state) => state.user,
    getNsd: (state) => state.nsd,
    getQuyen: (state) => state.quyen,
    isLoggedIn: (state) => state.isAuthenticated
  },
  
  actions: {
    login(token, user, nsd, quyen) {
      this.token = token
      this.user = user
      this.nsd = nsd
      this.quyen = quyen
      this.isAuthenticated = true
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem('token', token)
      }
    },
    
    logout() {
      this.token = null
      this.user = null
      this.nsd = null
      this.quyen = null
      this.isAuthenticated = false
      
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.clear()
    },
    
    // Restore session from localStorage
    restoreSession() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        this.isAuthenticated = true
      }
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage
      }
    ]
  }
})

