import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions, completions, kids } from '@/lib/db/schema'
import { sendToSubs } from '@/lib/push'
import { todayYmd } from '@/lib/week'

export const dynamic = 'force-dynamic'

type Sub = typeof pushSubscriptions.$inferSelect

async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  const url = new URL(req.url)
  const given = req.headers.get('x-cron-secret') ?? url.searchParams.get('secret')
  if (!secret || given !== secret) return new Response('no autorizado', { status: 401 })

  const today = todayYmd()

  // Suscripciones agrupadas por cuenta.
  const subs = await db.select().from(pushSubscriptions)
  const byAccount = new Map<number, Sub[]>()
  for (const s of subs) {
    const arr = byAccount.get(s.accountId) ?? []
    arr.push(s)
    byAccount.set(s.accountId, arr)
  }

  // Cuentas que YA han apuntado algo hoy → no molestar.
  const doneToday = await db
    .selectDistinct({ accountId: kids.accountId })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(eq(completions.doneOn, today))
  const doneSet = new Set(doneToday.map((r) => r.accountId))

  let accounts = 0
  let sent = 0
  for (const [accountId, list] of byAccount) {
    if (doneSet.has(accountId)) continue
    accounts++
    sent += await sendToSubs(list, {
      title: 'Colaboro 🧹',
      body: '¿Ya habéis apuntado las tareas de hoy? ¡A por las gemas! 💪',
      url: '/',
    })
  }

  return Response.json({ ok: true, accounts, sent })
}

export async function GET(req: Request) {
  return run(req)
}
export async function POST(req: Request) {
  return run(req)
}
