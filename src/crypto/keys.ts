import { deriveAesGcmKey, deriveAesKwKey } from './pbkdf2'
import { base64ToBuffer, bufferToBase64 } from './utils'

const WRAP_V2_MAGIC = new Uint8Array([0x57, 0x42, 0x32])

const RSA_OAEP_PARAMS: RsaHashedImportParams = {
  name: 'RSA-OAEP',
  hash: 'SHA-256',
}

const RSA_KEY_GEN: RsaHashedKeyGenParams = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: 'SHA-256',
}

export async function generateKeyPair(): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
}> {
  const pair = await crypto.subtle.generateKey(RSA_KEY_GEN, true, ['encrypt', 'decrypt'])
  return {
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
  }
}

export async function exportPublicKeyBase64(publicKey: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  return bufferToBase64(spki)
}

export async function importPublicKeyFromSpkiBase64(
  base64Spki: string,
): Promise<CryptoKey> {
  const buf = base64ToBuffer(base64Spki)
  return crypto.subtle.importKey('spki', buf, RSA_OAEP_PARAMS, false, ['encrypt'])
}

export async function importOwnPublicKeyFromSpkiBase64(
  base64Spki: string,
): Promise<CryptoKey> {
  const buf = base64ToBuffer(base64Spki)
  return crypto.subtle.importKey('spki', buf, RSA_OAEP_PARAMS, false, ['encrypt'])
}

function isV2WrappedEnvelope(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf)
  return (
    u.byteLength >= WRAP_V2_MAGIC.byteLength + 12 + 16 &&
    u[0] === WRAP_V2_MAGIC[0] &&
    u[1] === WRAP_V2_MAGIC[1] &&
    u[2] === WRAP_V2_MAGIC[2]
  )
}

/** v2: AES-GCM over PKCS#8 (avoids AES-KW’s multiple-of-8-byte restriction on some browsers). */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const gcmKey = await deriveAesGcmKey(password, salt)
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    gcmKey,
    pkcs8,
  )
  const ct = new Uint8Array(ciphertext)
  const out = new Uint8Array(WRAP_V2_MAGIC.byteLength + iv.byteLength + ct.byteLength)
  out.set(WRAP_V2_MAGIC, 0)
  out.set(iv, WRAP_V2_MAGIC.byteLength)
  out.set(ct, WRAP_V2_MAGIC.byteLength + iv.byteLength)
  return out.buffer
}

/** Supports v2 (AES-GCM envelope) and legacy v1 (AES-KW wrap). */
export async function unwrapPrivateKey(
  wrappedPkcs8Base64: string,
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const wrapped = base64ToBuffer(wrappedPkcs8Base64)
  if (isV2WrappedEnvelope(wrapped)) {
    const u = new Uint8Array(wrapped)
    const iv = u.subarray(WRAP_V2_MAGIC.byteLength, WRAP_V2_MAGIC.byteLength + 12)
    const ct = u.subarray(WRAP_V2_MAGIC.byteLength + 12)
    const gcmKey = await deriveAesGcmKey(password, salt)
    const pkcs8 = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      gcmKey,
      ct,
    )
    return crypto.subtle.importKey(
      'pkcs8',
      pkcs8,
      RSA_OAEP_PARAMS,
      true,
      ['decrypt', 'unwrapKey'],
    )
  }
  const kwKey = await deriveAesKwKey(password, salt)
  return crypto.subtle.unwrapKey(
    'pkcs8',
    wrapped,
    kwKey,
    'AES-KW',
    RSA_OAEP_PARAMS,
    true,
    ['decrypt', 'unwrapKey'],
  )
}

export async function rsaOaepEncrypt(
  publicKey: CryptoKey,
  plaintext: Uint8Array,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    RSA_OAEP_PARAMS,
    publicKey,
    plaintext as BufferSource,
  )
}

export async function rsaOaepDecrypt(
  privateKey: CryptoKey,
  ciphertext: ArrayBuffer,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(RSA_OAEP_PARAMS, privateKey, ciphertext)
}
