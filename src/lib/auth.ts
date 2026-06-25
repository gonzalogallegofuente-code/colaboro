// Sesión por cuenta. La cookie guarda "<accountId>.<exp>.<firma>" donde la firma
// es HMAC-SHA256(secret, "<accountId>.<exp>"). Web Crypto funciona en el proxy
// (edge) y en las Server Actions (node).

export const SESSION_COOKIE = 'colaboro_session'
const TTL_MS = 365 * 24 * 60 * 60 * 1000 // 1 año

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return b64url(new Uint8Array(sig))
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export async function makeSessionToken(secret: string, accountId: number): Promise<string> {
  const payload = `${accountId}.${Date.now() + TTL_MS}`
  return `${payload}.${await sign(secret, payload)}`
}

// Devuelve el accountId si la cookie es válida y no ha caducado, si no null.
export async function readSession(
  secret: string,
  token: string | undefined,
): Promise<number | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [accId, exp, sig] = parts
  if (!/^\d+$/.test(accId) || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return null
  if (!safeEqual(sig, await sign(secret, `${accId}.${exp}`))) return null
  return Number(accId)
}
