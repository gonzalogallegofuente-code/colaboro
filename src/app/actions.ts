'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { accounts, kids, tasks, completions, payouts, rewards, redemptions } from '@/lib/db/schema'
import { parseEurosToCents } from '@/lib/money'
import { kidBalances } from '@/lib/data'
import { hashPassword, verifyPassword } from '@/lib/password'
import { SESSION_COOKIE, makeSessionToken } from '@/lib/auth'
import { requireAccount } from '@/lib/session'

const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

function refresh() {
  revalidatePath('/', 'layout')
}

async function setSessionCookie(accountId: number) {
  const token = await makeSessionToken(process.env.COLABORO_SECRET!, accountId)
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
}

// Comprueba que el hijo pertenece a la cuenta.
async function assertKid(accountId: number, kidId: number) {
  const [k] = await db
    .select({ id: kids.id })
    .from(kids)
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  if (!k) throw new Error('No autorizado')
}

// ── Sesión / cuentas ─────────────────────────────────────────────────
export async function register(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect('/registro?e=email')
  if (password.length < 6) redirect('/registro?e=pass')

  const [exists] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, email))
  if (exists) redirect('/registro?e=dup')

  const [acc] = await db
    .insert(accounts)
    .values({ email, passwordHash: hashPassword(password) })
    .returning({ id: accounts.id })
  await setSessionCookie(acc.id)
  redirect('/')
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.email, email))
  if (!acc || !verifyPassword(password, acc.passwordHash)) {
    redirect('/login?e=1')
  }
  await setSessionCookie(acc.id)
  redirect('/')
}

export async function logout() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
  redirect('/login')
}

export async function changePassword(formData: FormData) {
  const accountId = await requireAccount()
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId))
  if (!acc || !verifyPassword(current, acc.passwordHash)) redirect('/tareas?pw=bad')
  if (next.length < 6) redirect('/tareas?pw=short')
  await db.update(accounts).set({ passwordHash: hashPassword(next) }).where(eq(accounts.id, accountId))
  redirect('/tareas?pw=ok')
}

// ── Tareas por defecto para un hijo nuevo ────────────────────────────
const DEFAULT_TASKS = [
  ['Aspirador casa', 'cocina + habitaciones + salón + pasillo', '🧹', 100, 7, '#f7d0e0'],
  ['Cuarto de baño', 'aspirar, lavabo, váter, bañera, espejo, fregar suelo', '🚽', 100, 2, '#cfe0f5'],
  ['Aspirar entrada', 'aspirar alfombra y suelo, limpiar polvo', '🚪', 100, 7, '#dde7dd'],
  ['Cristales', 'limpiar polvo, despacho + salón + habitaciones', '🪟', 100, 2, '#f2ecc9'],
  ['Tender la ropa', 'ropa estirada y bien colocada', '👕', 100, 7, '#ddd6f0'],
  ['Limpiar el polvo', 'de toda la casa, sacudir plumero cada poco tiempo', '🪶', 100, 7, '#f3d4e1'],
  ['Hacer la comida', '', '🍳', 100, 7, '#d2d8f0'],
  ['Recoger ropa tendal', 'dejar ropa organizada', '🧺', 100, 7, '#d6e1d6'],
  ['Recoger lavaplatos', 'sacar y colocar', '🍽️', 100, 7, '#e3e3c5'],
  ['Tirar la basura', 'orgánico, plásticos, papel y vidrio', '🗑️', 50, 7, '#c5cfe2'],
] as const

const DEFAULT_REWARDS = [
  ['30 min de pantalla extra', '🎮', 500],
  ['Un helado', '🍦', 300],
  ['Acostarse 30 min más tarde', '🌙', 400],
  ['Elegir la peli del finde', '🎬', 800],
] as const

async function seedKidDefaults(accountId: number, kidId: number) {
  await db.insert(tasks).values(
    DEFAULT_TASKS.map((t, i) => ({
      accountId,
      kidId,
      name: t[0],
      description: t[1] || null,
      icon: t[2],
      valueCents: t[3],
      weeklyTarget: t[4],
      color: t[5],
      sortOrder: i + 1,
    })),
  )
  await db.insert(rewards).values(
    DEFAULT_REWARDS.map((r, i) => ({
      accountId,
      kidId,
      name: r[0],
      icon: r[1],
      costCents: r[2],
      sortOrder: i + 1,
    })),
  )
}

// ── Marcar / deshacer ────────────────────────────────────────────────
export async function markTask(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!kidId || !taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [t] = await db
    .select({ v: tasks.valueCents })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.kidId, kidId), eq(tasks.accountId, accountId)))
  if (!t) throw new Error('Tarea no encontrada')

  await db.insert(completions).values({ kidId, taskId, doneOn, valueCents: t.v })
  refresh()
}

export async function undoTask(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!kidId || !taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)

  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .where(and(eq(completions.kidId, kidId), eq(completions.taskId, taskId), eq(completions.doneOn, doneOn)))
    .orderBy(desc(completions.id))
    .limit(1)
  if (row) await db.delete(completions).where(eq(completions.id, row.id))
  refresh()
}

export async function payKid(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  const balance = (await kidBalances(accountId)).get(kidId) ?? 0
  if (balance > 0) {
    await db.insert(payouts).values({ kidId, amountCents: balance, note: 'Liquidación' })
  }
  refresh()
}

// ── Tareas (por hijo) ────────────────────────────────────────────────
export async function addTask(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const valueCents = parseEurosToCents(String(formData.get('value') ?? '')) ?? 100
  const weeklyTarget = Math.max(1, Math.min(31, Number(formData.get('weeklyTarget')) || 7))
  const description = String(formData.get('description') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || '⭐'

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${tasks.sortOrder}),0)::int` })
    .from(tasks)
    .where(and(eq(tasks.accountId, accountId), eq(tasks.kidId, kidId)))
  await db.insert(tasks).values({
    accountId,
    kidId,
    name,
    description,
    icon,
    valueCents,
    weeklyTarget,
    color: '#e9d5ff',
    sortOrder: (max ?? 0) + 1,
  })
  redirect(`/tareas/editar?kid=${kidId}`)
}

export async function updateTask(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const valueCents = parseEurosToCents(String(formData.get('value') ?? '')) ?? 100
  const weeklyTarget = Math.max(1, Math.min(31, Number(formData.get('weeklyTarget')) || 7))
  const description = String(formData.get('description') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || '⭐'

  const [row] = await db
    .update(tasks)
    .set({ name, description, icon, valueCents, weeklyTarget })
    .where(and(eq(tasks.id, id), eq(tasks.accountId, accountId)))
    .returning({ kidId: tasks.kidId })
  redirect(`/tareas/editar?kid=${row?.kidId ?? ''}`)
}

export async function setTaskActive(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  const active = formData.get('active') === '1'
  if (!id) throw new Error('Datos inválidos')
  await db.update(tasks).set({ active }).where(and(eq(tasks.id, id), eq(tasks.accountId, accountId)))
  refresh()
}

// ── Hijos ────────────────────────────────────────────────────────────
export async function addKid(formData: FormData) {
  const accountId = await requireAccount()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const emoji = String(formData.get('emoji') ?? '').trim() || '🙂'
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${kids.sortOrder}),0)::int` })
    .from(kids)
    .where(eq(kids.accountId, accountId))
  const sortOrder = (max ?? 0) + 1
  const picked = String(formData.get('color') ?? '')
  const color = /^#[0-9a-fA-F]{6}$/.test(picked)
    ? picked
    : ['#2563eb', '#e11d48', '#16a34a', '#d97706', '#7c3aed'][sortOrder % 5]
  const [k] = await db.insert(kids).values({ accountId, name, emoji, color, sortOrder }).returning({ id: kids.id })
  await seedKidDefaults(accountId, k.id)
  redirect(`/tareas/${k.id}`)
}

export async function updateKid(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const emoji = String(formData.get('emoji') ?? '').trim() || '🙂'

  const set: { name: string; emoji: string; avatarUrl?: string | null; color?: string } = { name, emoji }
  const avatarUrl = String(formData.get('avatarUrl') ?? '')
  if (formData.get('clearAvatar') === '1') set.avatarUrl = null
  else if (avatarUrl.startsWith('data:image/')) {
    if (avatarUrl.length > 500_000) throw new Error('La foto es demasiado grande')
    set.avatarUrl = avatarUrl
  }
  const color = String(formData.get('color') ?? '')
  if (/^#[0-9a-fA-F]{6}$/.test(color)) set.color = color

  await db.update(kids).set(set).where(and(eq(kids.id, id), eq(kids.accountId, accountId)))
  redirect(`/tareas/${id}`)
}

export async function deleteKid(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  await assertKid(accountId, id)
  // Borramos las marcas primero (su FK a tasks es restrictiva); el borrado del
  // hijo arrastra en cascada tareas, recompensas, pagos y canjes.
  await db.transaction(async (tx) => {
    await tx.delete(completions).where(eq(completions.kidId, id))
    await tx.delete(kids).where(and(eq(kids.id, id), eq(kids.accountId, accountId)))
  })
  redirect('/tareas')
}

// ── Unidad / nombre de puntos / tema (POR HIJO) ──────────────────────
export async function setUnit(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await db
    .update(kids)
    .set({ unit: formData.get('unit') === 'pts' ? 'pts' : 'eur' })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

export async function setPointsName(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  const name = String(formData.get('pointsName') ?? '').trim() || 'gemas'
  const icon = String(formData.get('pointsIcon') ?? '').trim() || '💎'
  await db
    .update(kids)
    .set({ pointsName: name.slice(0, 20), pointsIcon: icon.slice(0, 8) })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

export async function setTheme(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await db
    .update(kids)
    .set({ theme: formData.get('theme') === 'juvenil' ? 'juvenil' : 'infantil' })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

// ── Meta de ahorro (por hijo) ────────────────────────────────────────
export async function setGoal(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  const name = String(formData.get('goalName') ?? '').trim()
  if (!name) {
    await db
      .update(kids)
      .set({ goalName: null, goalIcon: null, goalCostCents: null })
      .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
    redirect(`/tareas/${kidId}`)
  }
  const icon = String(formData.get('goalIcon') ?? '').trim() || '🎯'
  const cost = parseEurosToCents(String(formData.get('goalCost') ?? '')) ?? 0
  await db
    .update(kids)
    .set({ goalName: name.slice(0, 30), goalIcon: icon.slice(0, 8), goalCostCents: cost })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  redirect(`/tareas/${kidId}`)
}

export async function clearGoal(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await db
    .update(kids)
    .set({ goalName: null, goalIcon: null, goalCostCents: null })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  redirect(`/tareas/${kidId}`)
}

// ── Recompensas (por hijo) ───────────────────────────────────────────
export async function addReward(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const icon = String(formData.get('icon') ?? '').trim() || '🎁'
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${rewards.sortOrder}),0)::int` })
    .from(rewards)
    .where(and(eq(rewards.accountId, accountId), eq(rewards.kidId, kidId)))
  await db.insert(rewards).values({ accountId, kidId, name, icon, costCents, sortOrder: (max ?? 0) + 1 })
  redirect(`/recompensas/editar?kid=${kidId}`)
}

export async function updateReward(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const icon = String(formData.get('icon') ?? '').trim() || '🎁'
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  const [row] = await db
    .update(rewards)
    .set({ name, icon, costCents })
    .where(and(eq(rewards.id, id), eq(rewards.accountId, accountId)))
    .returning({ kidId: rewards.kidId })
  redirect(`/recompensas/editar?kid=${row?.kidId ?? ''}`)
}

export async function setRewardActive(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  const active = formData.get('active') === '1'
  if (!id) throw new Error('Datos inválidos')
  await db.update(rewards).set({ active }).where(and(eq(rewards.id, id), eq(rewards.accountId, accountId)))
  refresh()
}

export async function redeemReward(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const rewardId = Number(formData.get('rewardId'))
  if (!kidId || !rewardId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)

  const [r] = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.kidId, kidId), eq(rewards.accountId, accountId)))
  if (!r || !r.active) throw new Error('Recompensa no disponible')

  if (((await kidBalances(accountId)).get(kidId) ?? 0) < r.costCents) throw new Error('Saldo insuficiente')

  await db.insert(redemptions).values({
    kidId,
    rewardId: r.id,
    rewardName: r.name,
    rewardIcon: r.icon,
    costCents: r.costCents,
  })
  refresh()
}
