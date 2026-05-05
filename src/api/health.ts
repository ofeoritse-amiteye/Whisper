import axios from 'axios'
import { API_BASE } from './client'

export interface HealthResponse {
  status?: string
  environment: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await axios.get<HealthResponse>(`${API_BASE}/health`)
  return data
}
