const PBKDF2_WITHOUT_SALT: Omit<Pbkdf2Params, 'salt'> = {
  name: 'PBKDF2',
  iterations: 310_000,
  hash: 'SHA-256',
}

async function importPasswordRaw(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
}

async function deriveAes(
  password: string,
  salt: Uint8Array,
  algorithm: 'AES-KW' | 'AES-GCM',
  usages: readonly KeyUsage[],
): Promise<CryptoKey> {
  const keyMaterial = await importPasswordRaw(password)
  const target =
    algorithm === 'AES-KW'
      ? { name: 'AES-KW', length: 256 as const }
      : { name: 'AES-GCM', length: 256 as const }
  return crypto.subtle.deriveKey(
    { ...PBKDF2_WITHOUT_SALT, salt: salt as BufferSource },
    keyMaterial,
    target,
    false,
    usages,
  )
}

/** Legacy: unwrap only (pre–v2 wire format used AES-KW on PKCS#8). */
export async function deriveAesKwKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  return deriveAes(password, salt, 'AES-KW', ['wrapKey', 'unwrapKey'])
}

/** Current: wrap private key material (AES-GCM envelope; PKCS#8 length has no 8-byte constraint). */
export async function deriveAesGcmKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  return deriveAes(password, salt, 'AES-GCM', ['encrypt', 'decrypt'])
}
