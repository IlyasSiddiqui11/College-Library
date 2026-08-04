import axios from 'axios'

const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://college-library-2sfk.onrender.com' : 'http://localhost:8081')
// Increased timeout to 60s to account for Render free tier cold starts
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 60000)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  }
})

apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred.'

    if (error.code === 'ECONNABORTED') {
      message = `Request timed out after ${API_TIMEOUT_MS / 1000}s. Check if backend or database is reachable.`
    } else if (error.code === 'ERR_NETWORK') {
      message = `Cannot reach backend at ${API_BASE_URL}. Verify VITE_API_URL and backend port.`
    }

    console.error('[API Error]:', message, error)
    return Promise.reject(new Error(message))
  }
)
