import { and, eq, gte, lte, sql, desc, inArray } from 'drizzle-orm'
import { db } from './db'
import {
  accounts,
  kids,
  tasks,
  completions,
  payouts,
  rewards,
  redemptions,
  badges as badgeDefsTable,
  badgeAwards,
  type Kid,
  type Task,
  type Reward,
} from './db/schema'
import { weekRange, weekStartOf, parseYmd, ymd, addDays, weekDays, todayYmd, shiftWeek } from './week'
import { DEFAULT_BADGES, isMetric, metricValue, type BadgeDef } from './badges'
import { moneyOf, formatAmount } from './money'
import { sendToAccount } from './push'

// Medallas de la cuenta (las suyas si las ha personalizado, si no las por defecto).
export async function getBadgeDefs(accountId: number): Promise<BadgeDef[]> {
  const rows = await db
    .select()
    .from(badgeDefsTable)
    .where(eq(badgeDefsTable.accountId, accountId))
    .orderBy(badgeDefsTable.sortOrder, badgeDefsTable.id)
  if (rows.length === 0) return DEFAULT_BADGES
  return rows.map((r) => ({
    id: r.id,
    metric: isMetric(r.metric) ? r.metric : 'tasks',
    threshold: r.threshold,
    icon: r.icon,
    label: r.label,
    rewardCents: r.rewardCents,
  }))
}

// Abona (una sola vez) los premios de los logros que el hijo ya ha conseguido.
// Se llama al marcar tareas y al cambiar los logros; avisa por push al abonar.
export async function awardEarnedBadges(accountId: number, kidId: number): Promise<void> {
  const defs = (await getBadgeDefs(accountId)).filter((d) => d.id && (d.rewardCents ?? 0) > 0)
  if (defs.length === 0) return
  const stats = await getKidStats(kidId)
  const s = { bestStreak: stats.bestStreak, total: stats.total, earnedUnits: stats.earnedCents / 100 }
  const won = defs.filter((d) => metricValue(s, d.metric) >= d.threshold)
  if (won.length === 0) return
  const inserted = await db
    .insert(badgeAwards)
    .values(won.map((d) => ({ kidId, badgeId: d.id!, cents: d.rewardCents ?? 0 })))
    .onConflictDoNothing()
    .returning({ badgeId: badgeAwards.badgeId, cents: badgeAwards.cents })
  if (inserted.length === 0) return
  const [k] = await db.select().from(kids).where(eq(kids.id, kidId))
  if (!k) return
  for (const row of inserted) {
    const def = won.find((d) => d.id === row.badgeId)
    void sendToAccount(accountId, {
      title: '🏅 ¡Logro conseguido!',
      body: `${k.name} ha ganado «${def?.label ?? 'un logro'}» y su premio: +${formatAmount(row.cents, moneyOf(k))}`,
      url: `/logros?kid=${kidId}`,
    })
  }
}

// Si la cuenta no tiene medallas propias, siembra las por defecto (para editarlas).
export async function seedBadgesIfEmpty(accountId: number): Promise<void> {
  const existing = await db
    .select({ id: badgeDefsTable.id })
    .from(badgeDefsTable)
    .where(eq(badgeDefsTable.accountId, accountId))
    .limit(1)
  if (existing.length > 0) return
  await db.insert(badgeDefsTable).values(
    DEFAULT_BADGES.map((b, i) => ({
      accountId,
      metric: b.metric,
      threshold: b.threshold,
      icon: b.icon,
      label: b.label,
      sortOrder: i,
    })),
  )
}

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

// Saldo por hijo = ganado + premios de logros − pagado − canjeado (en céntimos).
export async function kidBalances(accountId: number): Promise<Map<number, number>> {
  const [earned, paid, redeemed, awards] = await Promise.all([
    db
      .select({ kidId: completions.kidId, c: sql<number>`coalesce(sum(${completions.valueCents}),0)::float8` })
      .from(completions)
      .innerJoin(kids, eq(kids.id, completions.kidId))
      .where(and(eq(kids.accountId, accountId), eq(completions.status, 'approved')))
      .groupBy(completions.kidId),
    db
      .select({ kidId: payouts.kidId, c: sql<number>`coalesce(sum(${payouts.amountCents}),0)::float8` })
      .from(payouts)
      .innerJoin(kids, eq(kids.id, payouts.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(payouts.kidId),
    db
      .select({ kidId: redemptions.kidId, c: sql<number>`coalesce(sum(${redemptions.costCents}),0)::float8` })
      .from(redemptions)
      .innerJoin(kids, eq(kids.id, redemptions.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(redemptions.kidId),
    db
      .select({ kidId: badgeAwards.kidId, c: sql<number>`coalesce(sum(${badgeAwards.cents}),0)::float8` })
      .from(badgeAwards)
      .innerJoin(kids, eq(kids.id, badgeAwards.kidId))
      .where(eq(kids.accountId, accountId))
      .groupBy(badgeAwards.kidId),
  ])
  const m = new Map<number, number>()
  for (const r of earned) m.set(r.kidId, (m.get(r.kidId) ?? 0) + r.c)
  for (const r of paid) m.set(r.kidId, (m.get(r.kidId) ?? 0) - r.c)
  for (const r of redeemed) m.set(r.kidId, (m.get(r.kidId) ?? 0) - r.c)
  for (const r of awards) m.set(r.kidId, (m.get(r.kidId) ?? 0) + r.c)
  return m
}

export type PendingCompletion = {
  id: number
  doneOn: string
  valueCents: number
  taskName: string
  taskIcon: string
  taskIconKey: string | null
  taskColor: string
  kidId: number
  kidName: string
  kidEmoji: string
  kidAvatarUrl: string | null
  kidUnit: string
  kidPointsName: string
  kidPointsIcon: string
}

// Marcas hechas por los niños que esperan la aprobación del padre.
export async function getPendingCompletions(accountId: number): Promise<PendingCompletion[]> {
  return db
    .select({
      id: completions.id,
      doneOn: completions.doneOn,
      valueCents: completions.valueCents,
      taskName: tasks.name,
      taskIcon: tasks.icon,
      taskIconKey: tasks.iconKey,
      taskColor: tasks.color,
      kidId: kids.id,
      kidName: kids.name,
      kidEmoji: kids.emoji,
      kidAvatarUrl: kids.avatarUrl,
      kidUnit: kids.unit,
      kidPointsName: kids.pointsName,
      kidPointsIcon: kids.pointsIcon,
    })
    .from(completions)
    .innerJoin(tasks, eq(tasks.id, completions.taskId))
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(and(eq(kids.accountId, accountId), eq(completions.status, 'pending')))
    .orderBy(desc(completions.doneOn), desc(completions.id))
}

export type PendingRedemption = {
  id: number
  costCents: number
  rewardName: string
  rewardIcon: string
  kidId: number
  kidName: string
  kidEmoji: string
  kidAvatarUrl: string | null
  kidUnit: string
  kidPointsName: string
  kidPointsIcon: string
}

// Canjes hechos por los niños que esperan la aprobación del padre.
export async function getPendingRedemptions(accountId: number): Promise<PendingRedemption[]> {
  return db
    .select({
      id: redemptions.id,
      costCents: redemptions.costCents,
      rewardName: redemptions.rewardName,
      rewardIcon: redemptions.rewardIcon,
      kidId: kids.id,
      kidName: kids.name,
      kidEmoji: kids.emoji,
      kidAvatarUrl: kids.avatarUrl,
      kidUnit: kids.unit,
      kidPointsName: kids.pointsName,
      kidPointsIcon: kids.pointsIcon,
    })
    .from(redemptions)
    .innerJoin(kids, eq(kids.id, redemptions.kidId))
    .where(and(eq(kids.accountId, accountId), eq(redemptions.status, 'pending')))
    .orderBy(desc(redemptions.id))
}

// ── Resumen para el histórico (por hijo) ─────────────────────────────
export type KidHistoryStats = {
  kidId: number
  name: string
  emoji: string
  avatarUrl: string | null
  color: string
  unit: string
  pointsName: string
  pointsIcon: string
  weekCount: number
  weekCents: number
  totalCount: number
  totalCents: number
  redeemedCents: number
  bestStreak: number
  topTaskName: string | null
  topTaskCount: number
}

export async function getHistoryStats(accountId: number): Promise<KidHistoryStats[]> {
  const kidList = await getActiveKids(accountId)
  const range = weekRange(todayYmd())
  const out: KidHistoryStats[] = []
  for (const k of kidList) {
    const [stats, weekAgg, redAgg, top] = await Promise.all([
      getKidStats(k.id),
      db
        .select({ n: sql<number>`count(*)::int`, c: sql<number>`coalesce(sum(${completions.valueCents}),0)::float8` })
        .from(completions)
        .where(
          and(
            eq(completions.kidId, k.id),
            eq(completions.status, 'approved'),
            gte(completions.doneOn, range.start),
            lte(completions.doneOn, range.end),
          ),
        ),
      db
        .select({ c: sql<number>`coalesce(sum(${redemptions.costCents}),0)::float8` })
        .from(redemptions)
        .where(and(eq(redemptions.kidId, k.id), eq(redemptions.status, 'approved'))),
      db
        .select({ name: tasks.name, n: sql<number>`count(*)::int` })
        .from(completions)
        .innerJoin(tasks, eq(tasks.id, completions.taskId))
        .where(and(eq(completions.kidId, k.id), eq(completions.status, 'approved')))
        .groupBy(tasks.name)
        .orderBy(sql`count(*) desc`)
        .limit(1),
    ])
    out.push({
      kidId: k.id,
      name: k.name,
      emoji: k.emoji,
      avatarUrl: k.avatarUrl,
      color: k.color,
      unit: k.unit,
      pointsName: k.pointsName,
      pointsIcon: k.pointsIcon,
      weekCount: weekAgg[0]?.n ?? 0,
      weekCents: weekAgg[0]?.c ?? 0,
      totalCount: stats.total,
      totalCents: stats.earnedCents,
      redeemedCents: redAgg[0]?.c ?? 0,
      bestStreak: stats.bestStreak,
      topTaskName: top[0]?.name ?? null,
      topTaskCount: top[0]?.n ?? 0,
    })
  }
  return out
}

// ── Plan de la semana (historial para ver la progresión) ─────────────
export type PlanHistory = {
  // Últimas 4 semanas PASADAS (con ceros si no hubo nada), en orden cronológico.
  weeks: { start: string; done: number }[]
  record: number // mejor semana pasada (con el plan actual como vara de medir)
  lastWeek: number
}

// "Hecho" de cada semana = Σ min(marcas, objetivo) por tarea DEL PLAN, así
// repetir una tarea de más no infla el plan. Se mide con el plan ACTUAL.
export async function getPlanHistory(kidId: number, targets: Map<number, number>): Promise<PlanHistory> {
  const ids = [...targets.keys()]
  if (ids.length === 0) return { weeks: [], record: 0, lastWeek: 0 }
  const rows = await db
    .select({ taskId: completions.taskId, doneOn: completions.doneOn })
    .from(completions)
    .where(and(eq(completions.kidId, kidId), eq(completions.status, 'approved'), inArray(completions.taskId, ids)))

  const byWeek = new Map<string, Map<number, number>>()
  for (const r of rows) {
    const ws = ymd(weekStartOf(parseYmd(r.doneOn)))
    let m = byWeek.get(ws)
    if (!m) {
      m = new Map()
      byWeek.set(ws, m)
    }
    m.set(r.taskId, (m.get(r.taskId) ?? 0) + 1)
  }
  const doneOf = (ws: string) => {
    const m = byWeek.get(ws)
    if (!m) return 0
    let s = 0
    for (const [tid, n] of m) s += Math.min(n, targets.get(tid) ?? 0)
    return s
  }

  const cur = weekRange(todayYmd()).start
  const weeks: { start: string; done: number }[] = []
  for (let i = 4; i >= 1; i--) {
    const ws = shiftWeek(cur, -i)
    weeks.push({ start: ws, done: doneOf(ws) })
  }
  let record = 0
  for (const ws of byWeek.keys()) if (ws < cur) record = Math.max(record, doneOf(ws))
  return { weeks, record, lastWeek: doneOf(shiftWeek(cur, -1)) }
}

// ── Objetivo familiar (semanal, entre todos los hijos) ───────────────
export type FamilyGoal = { target: number; reward: string; count: number; done: boolean }

// Objetivo de la cuenta y progreso de ESTA semana (tareas aprobadas de todos).
export async function getFamilyGoal(accountId: number): Promise<FamilyGoal | null> {
  const [acc] = await db
    .select({ target: accounts.familyGoalTarget, reward: accounts.familyGoalReward })
    .from(accounts)
    .where(eq(accounts.id, accountId))
  if (!acc?.target || acc.target <= 0) return null
  const range = weekRange(todayYmd())
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(
      and(
        eq(kids.accountId, accountId),
        eq(completions.status, 'approved'),
        gte(completions.doneOn, range.start),
        lte(completions.doneOn, range.end),
      ),
    )
  const count = row?.n ?? 0
  return { target: acc.target, reward: acc.reward ?? '', count, done: count >= acc.target }
}

// Aviso push justo cuando la familia ALCANZA el objetivo (una vez: al igualar).
export async function maybeCelebrateFamilyGoal(accountId: number): Promise<void> {
  const goal = await getFamilyGoal(accountId)
  if (goal && goal.count === goal.target) {
    void sendToAccount(accountId, {
      title: '🎉 ¡Objetivo familiar conseguido!',
      body: `Habéis llegado a ${goal.target} tareas esta semana → ${goal.reward}`,
      url: '/',
    })
  }
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
        cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::float8`,
      })
      .from(completions)
      .innerJoin(kids, eq(kids.id, completions.kidId))
      .where(
        and(
          eq(kids.accountId, accountId),
          eq(completions.status, 'approved'),
          gte(completions.doneOn, range.start),
          lte(completions.doneOn, range.end),
        ),
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
  iconStyle: string
  weekCents: number
  weekCount: number
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
    .select({
      kidId: completions.kidId,
      cents: sql<number>`coalesce(sum(${completions.valueCents}),0)::float8`,
      n: sql<number>`count(*)::int`,
    })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(
      and(
        eq(kids.accountId, accountId),
        eq(completions.status, 'approved'),
        gte(completions.doneOn, range.start),
        lte(completions.doneOn, range.end),
      ),
    )
    .groupBy(completions.kidId)
  const week = new Map(weekRows.map((r) => [r.kidId, r]))

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
    iconStyle: k.iconStyle,
    weekCents: week.get(k.id)?.cents ?? 0,
    weekCount: week.get(k.id)?.n ?? 0,
  }))
  const selectedKidId = kidId && kidList.some((k) => k.id === kidId) ? kidId : kidList[0].id
  const taskList = await getActiveTasks(accountId, selectedKidId)

  const rows = await db
    .select({ taskId: completions.taskId, doneOn: completions.doneOn, valueCents: completions.valueCents })
    .from(completions)
    .where(
      and(
        eq(completions.kidId, selectedKidId),
        eq(completions.status, 'approved'),
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
      .where(and(eq(kids.accountId, accountId), eq(completions.status, 'approved'))),
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
  status: string
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
        status: redemptions.status,
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

// ── Estadísticas / rachas de un hijo ─────────────────────────────────
export async function getKidStats(kidId: number): Promise<{
  currentStreak: number
  bestStreak: number
  total: number
  earnedCents: number
}> {
  const [dateRows, aggRows] = await Promise.all([
    db
      .selectDistinct({ d: completions.doneOn })
      .from(completions)
      .where(and(eq(completions.kidId, kidId), eq(completions.status, 'approved')))
      .orderBy(completions.doneOn),
    db
      .select({
        n: sql<number>`count(*)::int`,
        e: sql<number>`coalesce(sum(${completions.valueCents}),0)::float8`,
      })
      .from(completions)
      .where(and(eq(completions.kidId, kidId), eq(completions.status, 'approved'))),
  ])
  const dates = dateRows.map((r) => r.d)
  const set = new Set(dates)

  // Racha actual (indulgente: si hoy aún no se ha hecho nada, cuenta desde ayer).
  let currentStreak = 0
  let cursor = parseYmd(todayYmd())
  if (!set.has(ymd(cursor))) cursor = addDays(cursor, -1)
  while (set.has(ymd(cursor))) {
    currentStreak++
    cursor = addDays(cursor, -1)
  }

  // Mejor racha histórica.
  let bestStreak = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    if (prev && ymd(addDays(parseYmd(prev), 1)) === d) run++
    else run = 1
    if (run > bestStreak) bestStreak = run
    prev = d
  }

  return { currentStreak, bestStreak, total: aggRows[0]?.n ?? 0, earnedCents: aggRows[0]?.e ?? 0 }
}
