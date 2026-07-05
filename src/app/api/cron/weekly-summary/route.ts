import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions, completions, kids } from '@/lib/db/schema'
import { sendToSubs } from '@/lib/push'
import { todayYmd, weekRange } from '@/lib/week'
import { formatAmount, moneyOf } from '@/lib/money'

export const dynamic = 'force-dynamic'

type Sub = typeof pushSubscriptions.$inferSelect

// Resumen de la semana en curso por familia (pensado para el domingo por la
// tarde, via crontab). Solo por cabecera x-cron-secret.
async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('no autorizado', { status: 401 })
  }

  const range = weekRange(todayYmd())

  const subs = await db.select().from(pushSubscriptions)
  const byAccount = new Map<number, Sub[]>()
  for (const s of subs) {
    const arr = byAccount.get(s.accountId) ?? []
    arr.push(s)
    byAccount.set(s.accountId, arr)
  }

  // Tareas aprobadas de la semana por hijo (0 si no hizo ninguna).
  const rows = await db
    .select({
      accountId: kids.accountId,
      name: kids.name,
      unit: kids.unit,
      pointsName: kids.pointsName,
      pointsIcon: kids.pointsIcon,
      n: sql<number>`count(${completions.id})::int`,
      c: sql<number>`coalesce(sum(${completions.valueCents}),0)::int`,
    })
    .from(kids)
    .leftJoin(
      completions,
      and(
        eq(completions.kidId, kids.id),
        eq(completions.status, 'approved'),
        gte(completions.doneOn, range.start),
        lte(completions.doneOn, range.end),
      ),
    )
    .where(eq(kids.active, true))
    .groupBy(kids.id)

  let accounts = 0
  let sent = 0
  for (const [accountId, list] of byAccount) {
    const ks = rows.filter((r) => r.accountId === accountId)
    if (ks.length === 0) continue
    const body = ks
      .map((k) => `${k.name}: ${k.n} ${k.n === 1 ? 'tarea' : 'tareas'} (${formatAmount(k.c, moneyOf(k))})`)
      .join(' · ')
    accounts++
    sent += await sendToSubs(list, { title: '📊 Resumen de la semana', body, url: '/historico' })
  }

  return Response.json({ ok: true, accounts, sent })
}

export async function GET(req: Request) {
  return run(req)
}
export async function POST(req: Request) {
  return run(req)
}
