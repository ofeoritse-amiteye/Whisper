export function bufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function generateIV(lengthBytes = 12): Uint8Array {
  const iv = new Uint8Array(lengthBytes)
  crypto.getRandomValues(iv)
  return iv
}

export function generateSalt(lengthBytes = 16): Uint8Array {
  const salt = new Uint8Array(lengthBytes)
  crypto.getRandomValues(salt)
  return salt
}
