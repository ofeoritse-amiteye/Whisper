import { create } from 'zustand'
import type { UserProfile } from '../types/api'

export interface AuthState {
  user: UserProfile | null
  privateKey: CryptoKey | null
  publicKey: CryptoKey | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setSession: (args: {
    user: UserProfile
    accessToken: string
    refreshToken: string
    privateKey: CryptoKey
    publicKey: CryptoKey
  }) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: UserProfile) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  privateKey: null,
  publicKey: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setSession: ({ user, accessToken, refreshToken, privateKey, publicKey }) =>
    set({
      user,
      accessToken,
      refreshToken,
      privateKey,
      publicKey,
      isAuthenticated: true,
    }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setUser: (user) => set({ user }),

  clear: () =>
    set({
      user: null,
      privateKey: null,
      publicKey: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}))
