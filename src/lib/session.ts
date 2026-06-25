import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, readSession } from './auth'

// Cuenta del usuario logueado (o null).
export async function getAccountId(): Promise<number | null> {
  const c = await cookies()
  return readSession(process.env.COLABORO_SECRET!, c.get(SESSION_COOKIE)?.value)
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
