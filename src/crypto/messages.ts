import {
  importOwnPublicKeyFromSpkiBase64,
  importPublicKeyFromSpkiBase64,
  rsaOaepDecrypt,
  rsaOaepEncrypt,
} from './keys'
import { base64ToBuffer, bufferToBase64, generateIV } from './utils'

export async function encryptMessagePayload(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  ownPublicKeyForSelf: CryptoKey,
): Promise<{
  ciphertext: string
  iv: string
  encryptedKey: string
  encryptedKeyForSelf: string
}> {
  const enc = new TextEncoder()
  const plainBytes = enc.encode(plaintext)

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )

  const iv = generateIV(12)
  const gcmEncrypt: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as BufferSource,
  }

  const cipherBuf = await crypto.subtle.encrypt(
    gcmEncrypt,
    aesKey,
    plainBytes as BufferSource,
  )

  const rawAes = await crypto.subtle.exportKey('raw', aesKey)
  const rawBytes = new Uint8Array(rawAes)

  const encForRecipient = await rsaOaepEncrypt(recipientPublicKey, rawBytes)
  const encForSelf = await rsaOaepEncrypt(ownPublicKeyForSelf, rawBytes)

  return {
    ciphertext: bufferToBase64(cipherBuf),
    iv: bufferToBase64(iv),
    encryptedKey: bufferToBase64(encForRecipient),
    encryptedKeyForSelf: bufferToBase64(encForSelf),
  }
}

export async function decryptMessagePayload(
  payload: {
    ciphertext: string
    iv: string
    encryptedKey: string
    encryptedKeyForSelf: string
  },
  useEncryptedKeyForSelf: boolean,
  privateKey: CryptoKey,
): Promise<string> {
  const ivBuf = base64ToBuffer(payload.iv)
  const iv = new Uint8Array(ivBuf)
  const gcmDecrypt: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as BufferSource,
  }

  const keyCipherB64 = useEncryptedKeyForSelf
    ? payload.encryptedKeyForSelf
    : payload.encryptedKey
  const keyCipher = base64ToBuffer(keyCipherB64)

  const aesRaw = await rsaOaepDecrypt(privateKey, keyCipher)
  const aesKey = await crypto.subtle.importKey(
    'raw',
    aesRaw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )

  const cipherBytes = base64ToBuffer(payload.ciphertext)
  const plainBuf = await crypto.subtle.decrypt(
    gcmDecrypt,
    aesKey,
    cipherBytes as BufferSource,
  )

  const dec = new TextDecoder()
  return dec.decode(plainBuf)
}

export async function importRecipientPublicKeyBase64(
  base64Spki: string,
): Promise<CryptoKey> {
  return importPublicKeyFromSpkiBase64(base64Spki)
}

export async function importOwnPublicKeyForEncrypt(base64Spki: string): Promise<CryptoKey> {
  return importOwnPublicKeyFromSpkiBase64(base64Spki)
}
