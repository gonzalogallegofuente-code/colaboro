import webpush from 'web-push'
import { eq, inArray } from 'drizzle-orm'
import { db } from './db'
import { pushSubscriptions } from './db/schema'

let configured = false
function configure(): boolean {
  if (configured) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@colaboro.app', pub, priv)
  configured = true
  return true
}

export type PushPayload = { title: string; body: string; url?: string }
type Sub = { id: number; endpoint: string; p256dh: string; auth: string }

// Envía a una lista de suscripciones y borra las que ya no existen (404/410).
export async function sendToSubs(subs: Sub[], payload: PushPayload): Promise<number> {
  if (!configure() || subs.length === 0) return 0
  const data = JSON.stringify(payload)
  const dead: number[] = []
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        )
        sent++
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode
        if (code === 404 || code === 410) dead.push(s.id)
      }
    }),
  )
  if (dead.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead))
  return sent
}

// Envía a todos los dispositivos de una cuenta. No lanza (best-effort).
export async function sendToAccount(accountId: number, payload: PushPayload): Promise<void> {
  try {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.accountId, accountId))
    await sendToSubs(subs, payload)
  } catch {
    // best-effort: nunca romper la acción del usuario por un fallo de push
  }
}

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}
