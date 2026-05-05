import { api } from './client'
import type {
  ApiMessage,
  ConversationSummary,
  MessagePayloadWire,
  MessageResponse,
} from '../types/api'

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ConversationSummary[]>('/conversations')
  return data
}

export async function fetchMessages(
  peerUserId: string,
  options: { limit?: number; before?: string } = {},
): Promise<ApiMessage[]> {
  const { data } = await api.get<ApiMessage[]>(
    `/conversations/${encodeURIComponent(peerUserId)}/messages`,
    {
      params: {
        limit: options.limit ?? 50,
        ...(options.before ? { before: options.before } : {}),
      },
    },
  )
  return data
}

export async function sendMessageHttp(
  toUserId: string,
  payload: MessagePayloadWire,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/messages', {
    to: toUserId,
    payload,
  })
  return data
}
