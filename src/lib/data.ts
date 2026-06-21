import { and, eq, gte, lte, sql, desc } from 'drizzle-orm'
import { db } from './db'
import { kids, tasks, completions, payouts, type Kid, type Task } from './db/schema'
import { weekRange, weekStartOf, parseYmd, ymd, addDays } from './week'

export async function getActiveKids(): Promise<Kid[]> {
  return db.select().from(kids).where(eq(kids.active, true)).orderBy(kids.sortOrder, kids.id)
}

export async function getActiveTasks(): Promise<Task[]> {
  return db.select().from(tasks).where(eq(tasks.active, true)).orderBy(tasks.sortOrder, tasks.id)
}

export async function getAllTasks(): Promise<Task[]> {
  return db.select().from(tasks).orderBy(tasks.sortOrder, tasks.id)
}

export type KidSummary = Kid & { weekCents: number; balanceCents: number }

export type BoardData = {
  kids: KidSummary[]
  tasks: Task[]
  selectedKidId: number
  selectedDate: string
  range: { start: string; end: string }
  weekCountByTask: Record<number, number>
  dayCountByTask: Record<number, number>
}

export async function getBoardData(selectedDate: string, kidId?: number): Promise<BoardData | null> {
  const [kidList, taskList] = await Promise.all([getActiveKids(), getActiveTasks()])
  if (kidList.length === 0) return null

  const range = weekRange(selectedDate)

  const [earnedRows, paidRows, weekRows] = await Promise.all([
    db
      .select({
        kidId: completions.kidId,
        cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::int`,
      })
      .from(completions)
      .groupBy(completions.kidId),
    db
      .select({
        kidId: payouts.kidId,
        cents: sql<number>`coalesce(sum(${payouts.amountCents}),0)::int`,
      })
      .from(payouts)
      .groupBy(payouts.kidId),
    db
      .select({
        kidId: completions.kidId,
        cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::int`,
      })
      .from(completions)
      .where(and(gte(completions.doneOn, range.start), lte(completions.doneOn, range.end)))
      .groupBy(completions.kidId),
  ])

  const earned = new Map(earnedRows.map((r) => [r.kidId, r.cents]))
  const paid = new Map(paidRows.map((r) => [r.kidId, r.cents]))
  const week = new Map(weekRows.map((r) => [r.kidId, r.cents]))

  const kidSummaries: KidSummary[] = kidList.map((k) => ({
    ...k,
    weekCents: week.get(k.id) ?? 0,
    balanceCents: (earned.get(k.id) ?? 0) - (paid.get(k.id) ?? 0),
  }))

  const selectedKidId =
    kidId && kidList.some((k) => k.id === kidId) ? kidId : kidList[0].id

  const [weekTaskRows, dayTaskRows] = await Promise.all([
    db
      .select({ taskId: completions.taskId, n: sql<number>`count(*)::int` })
      .from(completions)
      .where(
        and(
          eq(completions.kidId, selectedKidId),
          gte(completions.doneOn, range.start),
          lte(completions.doneOn, range.end),
        ),
      )
      .groupBy(completions.taskId),
    db
      .select({ taskId: completions.taskId, n: sql<number>`count(*)::int` })
      .from(completions)
      .where(and(eq(completions.kidId, selectedKidId), eq(completions.doneOn, selectedDate)))
      .groupBy(completions.taskId),
  ])

  const weekCountByTask: Record<number, number> = {}
  for (const r of weekTaskRows) weekCountByTask[r.taskId] = r.n
  const dayCountByTask: Record<number, number> = {}
  for (const r of dayTaskRows) dayCountByTask[r.taskId] = r.n

  return {
    kids: kidSummaries,
    tasks: taskList,
    selectedKidId,
    selectedDate,
    range,
    weekCountByTask,
    dayCountByTask,
  }
}

export type WeekHistory = {
  start: string
  end: string
  perKid: Record<number, { cents: number; count: number }>
}

export type HistoryData = {
  kids: Kid[]
  weeks: WeekHistory[]
  payouts: { id: number; kidId: number; amountCents: number; paidAt: Date; note: string | null }[]
}

export async function getHistory(limitWeeks = 16): Promise<HistoryData> {
  const [kidList, comps, pays] = await Promise.all([
    db.select().from(kids).orderBy(kids.sortOrder, kids.id),
    db
      .select({
        kidId: completions.kidId,
        doneOn: completions.doneOn,
        valueCents: completions.valueCents,
      })
      .from(completions),
    db.select().from(payouts).orderBy(desc(payouts.paidAt)),
  ])

  const byWeek = new Map<string, WeekHistory>()
  for (const c of comps) {
    const start = ymd(weekStartOf(parseYmd(c.doneOn)))
    let w = byWeek.get(start)
    if (!w) {
      w = { start, end: ymd(addDays(parseYmd(start), 6)), perKid: {} }
      byWeek.set(start, w)
    }
    const cur = w.perKid[c.kidId] ?? { cents: 0, count: 0 }
    cur.cents += c.valueCents
    cur.count += 1
    w.perKid[c.kidId] = cur
  }

  const weeks = [...byWeek.values()]
    .sort((a, b) => (a.start < b.start ? 1 : -1))
    .slice(0, limitWeeks)

  return { kids: kidList, weeks, payouts: pays }
}
