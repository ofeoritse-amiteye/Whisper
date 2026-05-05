import { API_BASE } from '../api/client'
import type { WsIncoming } from '../types/api'

type WsMessageHandler = (msg: WsIncoming) => void
type PresenceHandler = (event: 'user.online' | 'user.offline', userId: string) => void
type TokenGetter = () => string | null

const WS_BASE = API_BASE.replace(/^http/, 'ws')

export class WhisperBoxWebSocket {
  private socket: WebSocket | null = null
  private closedByUser = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private readonly getToken: TokenGetter
  private readonly onMessageCb: WsMessageHandler
  private readonly onPresenceCb: PresenceHandler
  private readonly onConnectionChange?: (connected: boolean) => void

  constructor(
    getToken: TokenGetter,
    onMessage: WsMessageHandler,
    onPresence: PresenceHandler,
    onConnectionChange?: (connected: boolean) => void,
  ) {
    this.getToken = getToken
    this.onMessageCb = onMessage
    this.onPresenceCb = onPresence
    this.onConnectionChange = onConnectionChange
  }

  connect(): void {
    this.closedByUser = false
    const token = this.getToken()
    if (!token) return

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`
    try {
      this.socket = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.onConnectionChange?.(true)
      this.startHeartbeat()
    }

    this.socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as WsIncoming
        const evName =
          typeof data === 'object' && data !== null && 'event' in data
            ? (data as { event?: string }).event
            : undefined
        if (evName === 'message.receive') {
          this.onMessageCb(data)
        } else if (evName === 'user.online' || evName === 'user.offline') {
          this.onPresenceCb(evName, (data as { user_id: string }).user_id)
        } else if (evName === 'error') {
          this.onMessageCb(data)
        } else {
          // Unknown events ignored
        }
      } catch {
        // malformed payload
      }
    }

    this.socket.onerror = () => {
      // connection error — close handler will reconnect
    }

    this.socket.onclose = () => {
      this.stopHeartbeat()
      this.onConnectionChange?.(false)
      this.socket = null
      if (!this.closedByUser) {
        this.scheduleReconnect()
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.closedByUser) return
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 2000)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ event: 'ping' }))
      }
    }, 30_000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /** Reconnect with a fresh token (e.g. after HTTP refresh). */
  reconnect(): void {
    this.disconnect(false)
    this.closedByUser = false
    this.connect()
  }

  sendMessage(
    to: string,
    payload: {
      ciphertext: string
      iv: string
      encryptedKey: string
      encryptedKeyForSelf: string
    },
  ): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(
      JSON.stringify({
        event: 'message.send',
        to,
        payload,
      }),
    )
    return true
  }

  disconnect(userInitiated = true): void {
    this.closedByUser = userInitiated
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.onclose = null
      try {
        this.socket.close()
      } catch {
        // ignore
      }
      this.socket = null
    }
    this.onConnectionChange?.(false)
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}
