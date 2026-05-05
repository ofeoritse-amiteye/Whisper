import { api } from './client'
import type { PublicKeyResponse, UserSearchResult } from '../types/api'

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const { data } = await api.get<UserSearchResult[]>('/users/search', {
    params: { q },
  })
  return data
}

export async function fetchPublicKey(userId: string): Promise<string> {
  const { data } = await api.get<PublicKeyResponse>(
    `/users/${encodeURIComponent(userId)}/public-key`,
  )
  return data.public_key
}
