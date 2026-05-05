import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { sendMessageHttp } from '../api/messages'
import { fetchPublicKey } from '../api/users'
import {
  encryptMessagePayload,
  importOwnPublicKeyForEncrypt,
  importRecipientPublicKeyBase64,
} from '../crypto/messages'
import { enqueueOutbox } from '../db/outbox'
import type { ApiMessage, MessagePayloadWire } from '../types/api'
import { useToast } from '../components/ui/useToast'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'

const MAX_MESSAGE_LEN = 8000

export interface SendMessageHelpers {
  addOptimistic: (
    tempId: string,
    to: string,
    payload: MessagePayloadWire,
    plain: string,
  ) => void
  replaceOptimistic: (tempId: string, real: ApiMessage) => Promise<void>
  markOptimisticFailed: (tempId: string) => void
}

export function useSendMessage(
  peerUserId: string | null,
  sendWs: (to: string, payload: MessagePayloadWire) => boolean,
  helpers: SendMessageHelpers,
) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const privateKey = useAuthStore((s) => s.privateKey)
  const publicKey = useAuthStore((s) => s.publicKey)
  const pushPendingOutgoing = useChatStore((s) => s.pushPendingOutgoing)
  const removePendingOutgoing = useChatStore((s) => s.removePendingOutgoing)
  const toast = useToast()

  const encryptForPeer = useCallback(
    async (plain: string, recipientId: string) => {
      if (!user?.public_key || !publicKey) {
        throw new Error('Missing keys')
      }
      const pubB64 = await queryClient.fetchQuery({
        queryKey: ['publicKey', recipientId],
        queryFn: () => fetchPublicKey(recipientId),
        staleTime: 10 * 60_000,
      })
      const recipientPk = await importRecipientPublicKeyBase64(pubB64)
      const ownPk = await importOwnPublicKeyForEncrypt(user.public_key)
      return encryptMessagePayload(plain, recipientPk, ownPk)
    },
    [publicKey, queryClient, user],
  )

  const send = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim()
      if (!peerUserId || !user || !privateKey || !publicKey) return
      if (!trimmed.length || trimmed.length > MAX_MESSAGE_LEN) return

      const payload = await encryptForPeer(trimmed, peerUserId)
      const tempId = `temp-${crypto.randomUUID()}`
      helpers.addOptimistic(tempId, peerUserId, payload, trimmed)

      const finishHttp = async () => {
        try {
          const res = await sendMessageHttp(peerUserId, payload)
          await helpers.replaceOptimistic(tempId, res)
          void queryClient.invalidateQueries({ queryKey: ['conversations'] })
        } catch {
          helpers.markOptimisticFailed(tempId)
          toast.error('Message failed to send')
          await enqueueOutbox({
            id: tempId,
            to: peerUserId,
            payload,
            createdAt: Date.now(),
          })
        }
      }

      const wsOk = sendWs(peerUserId, payload)
      if (wsOk) {
        pushPendingOutgoing(peerUserId, tempId)
        window.setTimeout(() => {
          const q = useChatStore.getState().pendingOutgoing[peerUserId] ?? []
          if (!q.includes(tempId)) return
          removePendingOutgoing(peerUserId, tempId)
          void finishHttp()
        }, 15_000)
        return
      }

      await finishHttp()
    },
    [
      encryptForPeer,
      helpers,
      peerUserId,
      privateKey,
      publicKey,
      pushPendingOutgoing,
      queryClient,
      removePendingOutgoing,
      sendWs,
      toast,
      user,
    ],
  )

  return { send }
}
