import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { sendMessageHttp } from '../api/messages'
import { listOutbox, removeOutbox } from '../db/outbox'
import type { ApiMessage, WsMessageReceive } from '../types/api'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { WhisperBoxWebSocket } from '../ws/websocket'

export function useWebSocket(
  onServerMessage: (
    incoming: ApiMessage,
    options: { fromSelf: boolean; matchedTempId?: string },
  ) => void,
) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id)
  const setOnline = useChatStore((s) => s.setUserOnline)
  const setWsConnected = useChatStore((s) => s.setWsConnected)
  const setWsReconnecting = useChatStore((s) => s.setWsReconnecting)
  const queryClient = useQueryClient()

  const msgHandlerRef = useRef(onServerMessage)

  useEffect(() => {
    msgHandlerRef.current = onServerMessage
  }, [onServerMessage])

  const flushOutboxOnce = useCallback(async () => {
    const entries = await listOutbox()
    for (const e of entries) {
      try {
        await sendMessageHttp(e.to, e.payload)
        await removeOutbox(e.id)
        void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      } catch {
        void 0
      }
    }
  }, [queryClient])

  const clientRef = useRef<WhisperBoxWebSocket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      clientRef.current?.disconnect()
      clientRef.current = null
      setWsConnected(false)
      setWsReconnecting(false)
      return
    }

    setWsReconnecting(true)
    const getter = () => useAuthStore.getState().accessToken

    const ws = new WhisperBoxWebSocket(
      getter,
      (raw) => {
        if (
          typeof raw !== 'object' ||
          raw === null ||
          !('event' in raw) ||
          typeof (raw as { event?: unknown }).event !== 'string'
        ) {
          return
        }
        const event = (raw as { event: string }).event
        if (event === 'message.receive') {
          const m = raw as WsMessageReceive
          const apiMsg: ApiMessage = {
            id: m.id,
            from_user_id: m.from_user_id,
            to_user_id: m.to_user_id,
            payload: m.payload,
            delivered: true,
            created_at: m.created_at,
          }
          const fromSelf = userId !== undefined && m.from_user_id === userId
          let matchedTempId: string | undefined
          if (fromSelf) {
            const peer = m.to_user_id
            const pop = useChatStore.getState().popPendingOutgoing(peer)
            matchedTempId = pop ?? undefined
          }
          msgHandlerRef.current(apiMsg, { fromSelf, matchedTempId })
          void queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      },
      (ev, uid) => {
        setOnline(uid, ev === 'user.online')
      },
      (connected) => {
        setWsConnected(connected)
        if (connected) {
          setWsReconnecting(false)
          void flushOutboxOnce()
        } else {
          setWsReconnecting(true)
        }
      },
    )

    clientRef.current = ws
    ws.connect()

    return () => {
      ws.disconnect()
      clientRef.current = null
      setWsConnected(false)
    }
  }, [
    accessToken,
    flushOutboxOnce,
    isAuthenticated,
    queryClient,
    setOnline,
    setWsConnected,
    setWsReconnecting,
    userId,
  ])

  const sendMessage = useCallback(
    (to: string, payload: ApiMessage['payload']) => {
      return clientRef.current?.sendMessage(to, payload) ?? false
    },
    [],
  )

  return { sendMessage }
}
