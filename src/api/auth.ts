import { api } from './client'
import type { AuthTokens, LogoutResponse, UserProfile } from '../types/api'
import { useAuthStore } from '../store/authStore'

export interface RegisterBody {
  username: string
  display_name: string
  password: string
  public_key: string
  wrapped_private_key: string
  pbkdf2_salt: string
}

export interface LoginBody {
  username: string
  password: string
}

export async function registerAccount(body: RegisterBody): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/register', body)
  return data
}

export async function loginAccount(body: LoginBody): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login', body)
  return data
}

export async function fetchMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/auth/me')
  return data
}

export async function revokeSessionOnServer(): Promise<void> {
  const { accessToken, refreshToken } = useAuthStore.getState()
  if (!accessToken || !refreshToken) return
  try {
    await api.post<LogoutResponse>(
      '/auth/logout',
      { refresh_token: refreshToken },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
  } catch {
    void 0
  }
}
