import { and, eq, gte, lte, sql, desc } from 'drizzle-orm'
import { db } from './db'
import {
  kids,
  tasks,
  completions,
  payouts,
  rewards,
  redemptions,
  type Kid,
  type Task,
  type Reward,
} from './db/schema'
import { weekRange, weekStartOf, parseYmd, ymd, addDays, weekDays } from './week'

export async function getActiveKids(accountId: number): Promise<Kid[]> {
  return db
    .select()
    .from(kids)
    .where(and(eq(kids.accountId, accountId), eq(kids.active, true)))
    .orderBy(kids.sortOrder, kids.id)
}

export async function getActiveTasks(accountId: number, kidId: number): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.accountId, accountId), eq(tasks.kidId, kidId), eq(tasks.active, true)))
    .orderBy(tasks.sortOrder, tasks.id)
}

export async function getAllTasks(accountId: number, kidId: number): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.accountId, accountId), eq(tasks.kidId, kidId)))
    .orderBy(tasks.sortOrder, tasks.id)
}

// Saldo por hijo = ganado − pagado − canjeado (en céntimos), solo de la cuenta.
export async function kidBalances(accountId: number): Promise<Map<number, number>> {
  const [earned, paid, redeemed] = await Promise.all([
    db
      .select({ kidId: completions.kidId, c: sql<number>`coalesce(sum(${completions.valueCents}),0)::int` })
      .from(completions)
      .innerJoin(kids, eq(kids.id, completions.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(completions.kidId),
    db
      .select({ kidId: payouts.kidId, c: sql<number>`coalesce(sum(${payouts.amountCents}),0)::int` })
      .from(payouts)
      .innerJoin(kids, eq(kids.id, payouts.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(payouts.kidId),
    db
      .select({ kidId: redemptions.kidId, c: sql<number>`coalesce(sum(${redemptions.costCents}),0)::int` })
      .from(redemptions)
      .innerJoin(kids, eq(kids.id, redemptions.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(redemptions.kidId),
  ])
  const m = new Map<number, number>()
  for (const r of earned) m.set(r.kidId, (m.get(r.kidId) ?? 0) + r.c)
  for (const r of paid) m.set(r.kidId, (m.get(r.kidId) ?? 0) - r.c)
  for (const r of redeemed) m.set(r.kidId, (m.get(r.kidId) ?? 0) - r.c)
  return m
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

export async function getBoardData(
  accountId: number,
  selectedDate: string,
  kidId?: number,
): Promise<BoardData | null> {
  const kidList = await getActiveKids(accountId)
  if (kidList.length === 0) return null

  const range = weekRange(selectedDate)

  const [balances, weekRows] = await Promise.all([
    kidBalances(accountId),
    db
      .select({
        kidId: completions.kidId,
        cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::int`,
      })
      .from(completions)
      .innerJoin(kids, eq(kids.id, completions.kidId))
      .where(
        and(eq(kids.accountId, accountId), gte(completions.doneOn, range.start), lte(completions.doneOn, range.end)),
      )
      .groupBy(completions.kidId),
  ])

  const week = new Map(weekRows.map((r) => [r.kidId, r.cents]))
  const kidSummaries: KidSummary[] = kidList.map((k) => ({
    ...k,
    weekCents: week.get(k.id) ?? 0,
    balanceCents: balances.get(k.id) ?? 0,
  }))

  const selectedKidId = kidId && kidList.some((k) => k.id === kidId) ? kidId : kidList[0].id
  const taskList = await getActiveTasks(accountId, selectedKidId)

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

export type WeekGridKid = {
  id: number
  name: string
  emoji: string
  avatarUrl: string | null
  color: string
  theme: string
  unit: string
  pointsName: string
  pointsIcon: string
  weekCents: number
}
export type WeekGrid = {
  kids: WeekGridKid[]
  tasks: Task[]
  selectedKidId: number
  range: { start: string; end: string }
  days: { ymd: string; dow: string; dom: number }[]
  grid: Record<number, number[]>
  dayCents: number[]
  weekCents: number
}

export async function getWeekGrid(
  accountId: number,
  anyDate: string,
  kidId?: number,
): Promise<WeekGrid | null> {
  const kidList = await getActiveKids(accountId)
  if (kidList.length === 0) return null

  const range = weekRange(anyDate)
  const days = weekDays(range.start)

  const weekRows = await db
    .select({ kidId: completions.kidId, cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::int` })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(and(eq(kids.accountId, accountId), gte(completions.doneOn, range.start), lte(completions.doneOn, range.end)))
    .groupBy(completions.kidId)
  const week = new Map(weekRows.map((r) => [r.kidId, r.cents]))

  const kidsOut: WeekGridKid[] = kidList.map((k) => ({
    id: k.id,
    name: k.name,
    emoji: k.emoji,
    avatarUrl: k.avatarUrl,
    color: k.color,
    theme: k.theme,
    unit: k.unit,
    pointsName: k.pointsName,
    pointsIcon: k.pointsIcon,
    weekCents: week.get(k.id) ?? 0,
  }))
  const selectedKidId = kidId && kidList.some((k) => k.id === kidId) ? kidId : kidList[0].id
  const taskList = await getActiveTasks(accountId, selectedKidId)

  const rows = await db
    .select({ taskId: completions.taskId, doneOn: completions.doneOn, valueCents: completions.valueCents })
    .from(completions)
    .where(
      and(
        eq(completions.kidId, selectedKidId),
        gte(completions.doneOn, range.start),
        lte(completions.doneOn, range.end),
      ),
    )

  const dayIndex = new Map(days.map((d, i) => [d.ymd, i]))
  const grid: Record<number, number[]> = {}
  for (const t of taskList) grid[t.id] = Array(7).fill(0)
  const dayCents = Array(7).fill(0)
  let weekCents = 0
  for (const r of rows) {
    const di = dayIndex.get(r.doneOn)
    if (di === undefined) continue
    if (!grid[r.taskId]) grid[r.taskId] = Array(7).fill(0)
    grid[r.taskId][di] += 1
    dayCents[di] += r.valueCents
    weekCents += r.valueCents
  }

  return { kids: kidsOut, tasks: taskList, selectedKidId, range, days, grid, dayCents, weekCents }
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

export async function getHistory(accountId: number, limitWeeks = 16): Promise<HistoryData> {
  const [kidList, comps, pays] = await Promise.all([
    db.select().from(kids).where(eq(kids.accountId, accountId)).orderBy(kids.sortOrder, kids.id),
    db
      .select({ kidId: completions.kidId, doneOn: completions.doneOn, valueCents: completions.valueCents })
      .from(completions)
      .innerJoin(kids, eq(kids.id, completions.kidId))
      .where(eq(kids.accountId, accountId)),
    db
      .select({
        id: payouts.id,
        kidId: payouts.kidId,
        amountCents: payouts.amountCents,
        paidAt: payouts.paidAt,
        note: payouts.note,
      })
      .from(payouts)
      .innerJoin(kids, eq(kids.id, payouts.kidId))
      .where(eq(kids.accountId, accountId))
      .orderBy(desc(payouts.paidAt)),
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

  const weeks = [...byWeek.values()].sort((a, b) => (a.start < b.start ? 1 : -1)).slice(0, limitWeeks)
  return { kids: kidList, weeks, payouts: pays }
}

// ── Recompensas (por hijo) ───────────────────────────────────────────
export async function getAllRewards(accountId: number, kidId: number): Promise<Reward[]> {
  return db
    .select()
    .from(rewards)
    .where(and(eq(rewards.accountId, accountId), eq(rewards.kidId, kidId)))
    .orderBy(rewards.sortOrder, rewards.id)
}

export type RewardKid = {
  id: number
  name: string
  emoji: string
  avatarUrl: string | null
  color: string
  theme: string
  unit: string
  pointsName: string
  pointsIcon: string
  balanceCents: number
}
export type RecentRedemption = {
  id: number
  kidId: number
  rewardName: string
  rewardIcon: string
  costCents: number
  createdAt: Date
}
export type RewardsData = {
  kids: RewardKid[]
  selectedKidId: number
  rewards: Reward[]
  redemptions: RecentRedemption[]
}

export async function getRewardsData(accountId: number, kidId?: number): Promise<RewardsData | null> {
  const kidList = await getActiveKids(accountId)
  if (kidList.length === 0) return null

  const selectedKidId = kidId && kidList.some((k) => k.id === kidId) ? kidId : kidList[0].id

  const [balances, rewardList, recent] = await Promise.all([
    kidBalances(accountId),
    db
      .select()
      .from(rewards)
      .where(and(eq(rewards.accountId, accountId), eq(rewards.kidId, selectedKidId), eq(rewards.active, true)))
      .orderBy(rewards.sortOrder, rewards.id),
    db
      .select({
        id: redemptions.id,
        kidId: redemptions.kidId,
        rewardName: redemptions.rewardName,
        rewardIcon: redemptions.rewardIcon,
        costCents: redemptions.costCents,
        createdAt: redemptions.createdAt,
      })
      .from(redemptions)
      .innerJoin(kids, eq(kids.id, redemptions.kidId))
      .where(eq(kids.accountId, accountId))
      .orderBy(desc(redemptions.createdAt))
      .limit(20),
  ])

  const kidsOut: RewardKid[] = kidList.map((k) => ({
    id: k.id,
    name: k.name,
    emoji: k.emoji,
    avatarUrl: k.avatarUrl,
    color: k.color,
    theme: k.theme,
    unit: k.unit,
    pointsName: k.pointsName,
    pointsIcon: k.pointsIcon,
    balanceCents: balances.get(k.id) ?? 0,
  }))

  return { kids: kidsOut, selectedKidId, rewards: rewardList, redemptions: recent }
}
