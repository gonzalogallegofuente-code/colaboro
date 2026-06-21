// Sesión mínima por PIN compartido. La cookie guarda "<exp>.<firma>" donde la
// firma es HMAC-SHA256(secret, exp). Sin estado en BD. Web Crypto funciona tanto
// en el middleware (edge) como en las Server Actions (node).

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

export async function makeSessionToken(secret: string): Promise<string> {
  const exp = String(Date.now() + TTL_MS)
  return `${exp}.${await sign(secret, exp)}`
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  return safeEqual(sig, await sign(secret, exp))
}

// Comparación de PIN en tiempo constante.
export function pinMatches(input: string, expected: string | undefined): boolean {
  if (!expected) return false
  return safeEqual(input, expected)
}
