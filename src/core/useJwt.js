import axios from 'axios'
import { useStore } from './store'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from store or localStorage
    const authStore = useStore()
    const token = authStore.token || localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          const authStore = useStore()
          authStore.logout()
          window.location.href = '/'
          break
        case 403:
          console.error('Forbidden - You do not have permission')
          break
        case 404:
          console.error('Not Found - Resource not found')
          break
        case 500:
          console.error('Server Error - Please try again later')
          break
        default:
          console.error('An error occurred:', error.response.data)
      }
    } else if (error.request) {
      console.error('No response received from server')
    } else {
      console.error('Error setting up request:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Export methods
const useJwt = {
  // GET request
  get(url, config = {}) {
    return axiosInstance.get(url, config)
  },
  
  // POST request
  post(url, data = {}, config = {}) {
    return axiosInstance.post(url, data, config)
  },
  
  // PUT request
  put(url, data = {}, config = {}) {
    return axiosInstance.put(url, data, config)
  },
  
  // DELETE request
  delete(url, config = {}) {
    return axiosInstance.delete(url, config)
  },
  
  // PATCH request
  patch(url, data = {}, config = {}) {
    return axiosInstance.patch(url, data, config)
  }
}

export default useJwt

