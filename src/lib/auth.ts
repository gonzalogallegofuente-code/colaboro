// Sesión por cuenta. La cookie guarda "<accountId>.<pwv>.<exp>.<firma>" donde
// la firma es HMAC-SHA256(secret, "<accountId>.<pwv>.<exp>") y <pwv> es la
// "versión de contraseña" (huella corta del hash): al cambiar la contraseña
// cambia el pwv y TODAS las sesiones anteriores dejan de valer.
// Web Crypto funciona en el proxy (edge) y en las Server Actions (node).

export const SESSION_COOKIE = 'colaboro_session'
export const KID_COOKIE = 'colaboro_kid'
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

// "Versión de contraseña": huella corta (sha256) del hash almacenado.
export async function pwvOf(passwordHash: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(passwordHash))
  return Array.from(new Uint8Array(digest).slice(0, 5))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function makeSessionToken(secret: string, accountId: number, pwv: string): Promise<string> {
  const payload = `${accountId}.${pwv}.${Date.now() + TTL_MS}`
  return `${payload}.${await sign(secret, payload)}`
}

export type SessionPayload = { accountId: number; pwv: string }

// Devuelve {accountId, pwv} si la cookie es válida y no ha caducado, si no null.
// OJO: el pwv se contrasta con la BD en getAccountId (aquí solo firma+caducidad).
export async function readSession(
  secret: string,
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [accId, pwv, exp, sig] = parts
  if (!/^\d+$/.test(accId) || !/^[0-9a-f]{10}$/.test(pwv) || !/^\d+$/.test(exp)) return null
  if (Number(exp) < Date.now()) return null
  if (!safeEqual(sig, await sign(secret, `${accId}.${pwv}.${exp}`))) return null
  return { accountId: Number(accId), pwv }
}

// ── Sesión de "modo niño" ────────────────────────────────────────────
// Cookie "<accountId>.<kidId>.<exp>.<firma>". Es excluyente con la sesión
// de cuenta: al entrar en modo niño se borra la cookie de cuenta.
export async function makeKidToken(secret: string, accountId: number, kidId: number): Promise<string> {
  const payload = `${accountId}.${kidId}.${Date.now() + TTL_MS}`
  return `${payload}.${await sign(secret, payload)}`
}

export async function readKidToken(
  secret: string,
  token: string | undefined,
): Promise<{ accountId: number; kidId: number } | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [accId, kidId, exp, sig] = parts
  if (!/^\d+$/.test(accId) || !/^\d+$/.test(kidId) || !/^\d+$/.test(exp)) return null
  if (Number(exp) < Date.now()) return null
  if (!safeEqual(sig, await sign(secret, `${accId}.${kidId}.${exp}`))) return null
  return { accountId: Number(accId), kidId: Number(kidId) }
}
