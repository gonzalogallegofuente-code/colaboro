'use server'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { db } from '@/lib/db'
import { accounts, webauthnCredentials } from '@/lib/db/schema'
import { requireAccount, getKidMode } from '@/lib/session'
import { rpInfo, RP_NAME } from '@/lib/webauthn'
import { SESSION_COOKIE, KID_COOKIE, makeSessionToken } from '@/lib/auth'

const CHALLENGE_COOKIE = 'colaboro_wa_ch'
const prod = process.env.NODE_ENV === 'production'

async function setChallenge(value: string) {
  const c = await cookies()
  c.set(CHALLENGE_COOKIE, value, { httpOnly: true, sameSite: 'lax', secure: prod, path: '/', maxAge: 300 })
}
async function takeChallenge(): Promise<string | undefined> {
  const c = await cookies()
  return c.get(CHALLENGE_COOKIE)?.value
}

const toTransports = (t: string | null): AuthenticatorTransportFuture[] | undefined =>
  t ? (t.split(',') as AuthenticatorTransportFuture[]) : undefined

// ── Registro (con sesión de padre) ───────────────────────────────────
export async function registerOptions() {
  const accountId = await requireAccount()
  const { rpID } = await rpInfo()
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId))
  const existing = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.accountId, accountId))

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: acc?.email ?? `cuenta-${accountId}`,
    userID: new TextEncoder().encode(String(accountId)),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  })
  await setChallenge(options.challenge)
  return options
}

export async function registerVerify(response: RegistrationResponseJSON): Promise<{ ok: boolean }> {
  const accountId = await requireAccount()
  const { rpID, origin } = await rpInfo()
  const expectedChallenge = await takeChallenge()
  if (!expectedChallenge) return { ok: false }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })
  if (!verification.verified || !verification.registrationInfo) return { ok: false }

  const cred = verification.registrationInfo.credential
  await db
    .insert(webauthnCredentials)
    .values({
      id: cred.id,
      accountId,
      publicKey: Buffer.from(cred.publicKey).toString('base64url'),
      counter: cred.counter,
      transports: cred.transports ? cred.transports.join(',') : null,
    })
    .onConflictDoNothing()

  const c = await cookies()
  c.delete(CHALLENGE_COOKIE)
  return { ok: true }
}

// ── Autenticación para salir del modo niño ───────────────────────────
export async function authOptions(): Promise<{
  ok: boolean
  reason?: string
  options?: PublicKeyCredentialRequestOptionsJSON
}> {
  const kid = await getKidMode()
  if (!kid) return { ok: false, reason: 'nokid' }
  const { rpID } = await rpInfo()
  const creds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.accountId, kid.accountId))
  if (creds.length === 0) return { ok: false, reason: 'none' }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({ id: c.id, transports: toTransports(c.transports) })),
    userVerification: 'required',
  })
  await setChallenge(options.challenge)
  return { ok: true, options }
}

export async function authVerify(response: AuthenticationResponseJSON): Promise<{ ok: boolean }> {
  const kid = await getKidMode()
  if (!kid) return { ok: false }
  const { rpID, origin } = await rpInfo()
  const expectedChallenge = await takeChallenge()
  if (!expectedChallenge) return { ok: false }

  const [cred] = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.id, response.id))
  if (!cred || cred.accountId !== kid.accountId) return { ok: false }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: cred.id,
      publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64url')),
      counter: cred.counter,
      transports: toTransports(cred.transports),
    },
  })
  if (!verification.verified) return { ok: false }

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentials.id, cred.id))

  // Éxito: salimos del modo niño reabriendo la sesión del padre.
  const c = await cookies()
  c.delete(CHALLENGE_COOKIE)
  c.delete(KID_COOKIE)
  const token = await makeSessionToken(process.env.COLABORO_SECRET!, kid.accountId)
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: prod,
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
  return { ok: true }
}

// ¿Tiene la cuenta (del modo niño) alguna huella registrada?
export async function hasFingerprint(): Promise<boolean> {
  const kid = await getKidMode()
  if (!kid) return false
  const creds = await db.select({ id: webauthnCredentials.id }).from(webauthnCredentials).where(eq(webauthnCredentials.accountId, kid.accountId))
  return creds.length > 0
}
