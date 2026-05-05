export interface UserProfile {
  id: string
  username: string
  display_name: string
  public_key: string
  wrapped_private_key: string
  pbkdf2_salt: string
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: UserProfile
}

export interface RefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface ConversationSummary {
  user_id: string
  display_name: string
  username: string
  last_message_at: string
}

export interface MessagePayloadWire {
  ciphertext: string
  iv: string
  encryptedKey: string
  encryptedKeyForSelf: string
}

export interface ApiMessage {
  id: string
  from_user_id: string
  to_user_id: string
  payload: MessagePayloadWire
  delivered: boolean
  created_at: string
}

export type MessageResponse = ApiMessage

export interface PublicKeyResponse {
  public_key: string
}

export interface UserSearchResult {
  id: string
  username: string
  display_name: string
}

export interface LogoutResponse {
  detail: string
}

export interface WsError {
  event: 'error'
  detail: string
}

export interface WsMessageReceive {
  event: 'message.receive'
  id: string
  from_user_id: string
  to_user_id: string
  payload: MessagePayloadWire
  created_at: string
}

export interface WsPresence {
  event: 'user.online' | 'user.offline'
  user_id: string
}

export type WsIncoming = WsMessageReceive | WsPresence | WsError | Record<string, unknown>
