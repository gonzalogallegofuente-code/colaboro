import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, KID_COOKIE, readSession, readKidToken } from './auth'

// Cuenta del usuario logueado (o null). Solo la cookie de cuenta.
export async function getAccountId(): Promise<number | null> {
  const c = await cookies()
  return readSession(process.env.COLABORO_SECRET!, c.get(SESSION_COOKIE)?.value)
}

// Sesión de modo niño (o null).
export async function getKidMode(): Promise<{ accountId: number; kidId: number } | null> {
  const c = await cookies()
  return readKidToken(process.env.COLABORO_SECRET!, c.get(KID_COOKIE)?.value)
}

// Quién está mirando: el padre (kidId null) o un hijo en modo niño.
export type Viewer = { accountId: number; kidId: number | null; isKid: boolean }
export async function getViewer(): Promise<Viewer | null> {
  const accountId = await getAccountId()
  if (accountId) return { accountId, kidId: null, isKid: false }
  const kid = await getKidMode()
  if (kid) return { accountId: kid.accountId, kidId: kid.kidId, isKid: true }
  return null
}

// Para páginas: devuelve la cuenta o redirige a /login.
export async function requireAccountPage(): Promise<number> {
  const id = await getAccountId()
  if (!id) redirect('/login')
  return id
}

// Para Server Actions: devuelve la cuenta o lanza.
export async function requireAccount(): Promise<number> {
  const id = await getAccountId()
  if (!id) throw new Error('No autorizado')
  return id
}

// Para páginas visibles por el niño (tablero, semana, recompensas, logros).
export async function requireViewerPage(): Promise<Viewer> {
  const v = await getViewer()
  if (!v) redirect('/login')
  return v
}

// Para acciones del modo niño: devuelve {accountId, kidId} o lanza.
export async function requireKidMode(): Promise<{ accountId: number; kidId: number }> {
  const k = await getKidMode()
  if (!k) throw new Error('No autorizado')
  return k
}
