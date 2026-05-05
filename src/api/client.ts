import axios, {type AxiosError,type AxiosInstance,type InternalAxiosRequestConfig,} from 'axios'
import { useAuthStore } from '../store/authStore'
import type { RefreshResponse } from '../types/api'

export const API_BASE = 'https://whisperbox.koyeb.app'

const plain = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

let refreshInFlight: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const { refreshToken, setAccessToken, clear } = useAuthStore.getState()
  if (!refreshToken) {
    clear()
    return null
  }
  try {
    const { data } = await plain.post<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    setAccessToken(data.access_token)
    return data.access_token
  } catch {
    clear()
    return null
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const url = original?.url ?? ''

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/refresh') &&
      !url.endsWith('/auth/login') &&
      !url.endsWith('/auth/register')
    ) {
      original._retry = true
      const newAccess = await refreshAccessToken()
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
