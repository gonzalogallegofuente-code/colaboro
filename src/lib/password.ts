import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Hash de contraseña con scrypt (sin dependencias externas).
// Formato almacenado: "<saltHex>:<hashHex>".
export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(pw, salt, 64)
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, keyHex] = (stored ?? '').split(':')
  if (!saltHex || !keyHex) return false
  const key = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64)
  const keyBuf = Buffer.from(keyHex, 'hex')
  return key.length === keyBuf.length && timingSafeEqual(key, keyBuf)
}
