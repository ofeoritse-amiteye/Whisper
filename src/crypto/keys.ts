import { base64ToBuffer, bufferToBase64 } from './utils'

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

/** Import own RSA public key for encrypting AES key for self (sent message history). */
export async function importOwnPublicKeyFromSpkiBase64(
  base64Spki: string,
): Promise<CryptoKey> {
  const buf = base64ToBuffer(base64Spki)
  return crypto.subtle.importKey('spki', buf, RSA_OAEP_PARAMS, false, ['encrypt'])
}

export async function wrapPrivateKey(
  privateKey: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<ArrayBuffer> {
  return crypto.subtle.wrapKey('pkcs8', privateKey, wrappingKey, 'AES-KW')
}

export async function unwrapPrivateKey(
  wrappedPkcs8Base64: string,
  wrappingKey: CryptoKey,
): Promise<CryptoKey> {
  const wrapped = base64ToBuffer(wrappedPkcs8Base64)
  return crypto.subtle.unwrapKey(
    'pkcs8',
    wrapped,
    wrappingKey,
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
