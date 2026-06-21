'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { kids, tasks, completions, payouts, rewards, redemptions } from '@/lib/db/schema'
import { parseEurosToCents } from '@/lib/money'
import { kidBalances } from '@/lib/data'
import { setSetting, setUnitValue } from '@/lib/settings'
import {
  SESSION_COOKIE,
  makeSessionToken,
  pinMatches,
  verifySessionToken,
} from '@/lib/auth'

async function requireAuth() {
  const c = await cookies()
  const ok = await verifySessionToken(
    process.env.COLABORO_SECRET!,
    c.get(SESSION_COOKIE)?.value,
  )
  if (!ok) throw new Error('No autorizado')
}

const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

// Paleta pastel para tareas/hijos nuevos.
const PALETTE = [
  '#f7d0e0', '#cfe0f5', '#dde7dd', '#f2ecc9', '#ddd6f0',
  '#f3d4e1', '#d2d8f0', '#d6e1d6', '#e3e3c5', '#c5cfe2',
]

function refresh() {
  revalidatePath('/', 'layout')
}

// ── Marcar / deshacer ────────────────────────────────────────────────
export async function markTask(formData: FormData) {
  await requireAuth()
  const kidId = Number(formData.get('kidId'))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!kidId || !taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [t] = await db
    .select({ v: tasks.valueCents })
    .from(tasks)
    .where(eq(tasks.id, taskId))
  if (!t) throw new Error('Tarea no encontrada')

  await db.insert(completions).values({ kidId, taskId, doneOn, valueCents: t.v })
  refresh()
}

export async function undoTask(formData: FormData) {
  await requireAuth()
  const kidId = Number(formData.get('kidId'))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!kidId || !taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .where(
      and(
        eq(completions.kidId, kidId),
        eq(completions.taskId, taskId),
        eq(completions.doneOn, doneOn),
      ),
    )
    .orderBy(desc(completions.id))
    .limit(1)
  if (row) await db.delete(completions).where(eq(completions.id, row.id))
  refresh()
}

// ── Liquidar (pagar) ─────────────────────────────────────────────────
export async function payKid(formData: FormData) {
  await requireAuth()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')

  const balances = await kidBalances()
  const balance = balances.get(kidId) ?? 0
  if (balance > 0) {
    await db.insert(payouts).values({ kidId, amountCents: balance, note: 'Liquidación' })
  }
  refresh()
}

// ── Tareas (añadir / editar / activar) ───────────────────────────────
export async function addTask(formData: FormData) {
  await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const valueCents = parseEurosToCents(String(formData.get('value') ?? '')) ?? 100
  const weeklyTarget = Math.max(1, Math.min(31, Number(formData.get('weeklyTarget')) || 7))
  const description = String(formData.get('description') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || '⭐'

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${tasks.sortOrder}),0)::int` })
    .from(tasks)
  const sortOrder = (max ?? 0) + 1
  const color = PALETTE[sortOrder % PALETTE.length]

  await db.insert(tasks).values({ name, description, icon, valueCents, weeklyTarget, color, sortOrder })
  redirect('/tareas')
}

export async function updateTask(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const valueCents = parseEurosToCents(String(formData.get('value') ?? '')) ?? 100
  const weeklyTarget = Math.max(1, Math.min(31, Number(formData.get('weeklyTarget')) || 7))
  const description = String(formData.get('description') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || '⭐'

  await db.update(tasks).set({ name, description, icon, valueCents, weeklyTarget }).where(eq(tasks.id, id))
  redirect('/tareas')
}

export async function setTaskActive(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  const active = formData.get('active') === '1'
  if (!id) throw new Error('Datos inválidos')
  await db.update(tasks).set({ active }).where(eq(tasks.id, id))
  refresh()
}

export async function addKid(formData: FormData) {
  await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const emoji = String(formData.get('emoji') ?? '').trim() || '🙂'
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${kids.sortOrder}),0)::int` })
    .from(kids)
  const sortOrder = (max ?? 0) + 1
  const picked = String(formData.get('color') ?? '')
  const color = /^#[0-9a-fA-F]{6}$/.test(picked)
    ? picked
    : ['#2563eb', '#e11d48', '#16a34a', '#d97706', '#7c3aed'][sortOrder % 5]
  await db.insert(kids).values({ name, emoji, color, sortOrder })
  redirect('/tareas')
}

export async function updateKid(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const emoji = String(formData.get('emoji') ?? '').trim() || '🙂'

  const set: { name: string; emoji: string; avatarUrl?: string | null; color?: string } = { name, emoji }
  const avatarUrl = String(formData.get('avatarUrl') ?? '')
  if (formData.get('clearAvatar') === '1') {
    set.avatarUrl = null
  } else if (avatarUrl.startsWith('data:image/')) {
    if (avatarUrl.length > 500_000) throw new Error('La foto es demasiado grande')
    set.avatarUrl = avatarUrl
  }
  const color = String(formData.get('color') ?? '')
  if (/^#[0-9a-fA-F]{6}$/.test(color)) set.color = color

  await db.update(kids).set(set).where(eq(kids.id, id))
  redirect('/tareas')
}

// ── Unidad (€ / puntos) ──────────────────────────────────────────────
export async function setUnit(formData: FormData) {
  await requireAuth()
  const unit = formData.get('unit') === 'pts' ? 'pts' : 'eur'
  await setUnitValue(unit)
  refresh()
}

export async function setTheme(formData: FormData) {
  await requireAuth()
  const theme = formData.get('theme') === 'juvenil' ? 'juvenil' : 'infantil'
  await setSetting('theme', theme)
  refresh()
}

export async function setPointsName(formData: FormData) {
  await requireAuth()
  const name = String(formData.get('pointsName') ?? '').trim() || 'gemas'
  const icon = String(formData.get('pointsIcon') ?? '').trim() || '💎'
  await setSetting('points_name', name.slice(0, 20))
  await setSetting('points_icon', icon.slice(0, 8))
  refresh()
}

// ── Recompensas ──────────────────────────────────────────────────────
export async function addReward(formData: FormData) {
  await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const icon = String(formData.get('icon') ?? '').trim() || '🎁'
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${rewards.sortOrder}),0)::int` })
    .from(rewards)
  await db.insert(rewards).values({ name, icon, costCents, sortOrder: (max ?? 0) + 1 })
  redirect('/recompensas/editar')
}

export async function updateReward(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const icon = String(formData.get('icon') ?? '').trim() || '🎁'
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  await db.update(rewards).set({ name, icon, costCents }).where(eq(rewards.id, id))
  redirect('/recompensas/editar')
}

export async function setRewardActive(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get('id'))
  const active = formData.get('active') === '1'
  if (!id) throw new Error('Datos inválidos')
  await db.update(rewards).set({ active }).where(eq(rewards.id, id))
  refresh()
}

export async function redeemReward(formData: FormData) {
  await requireAuth()
  const kidId = Number(formData.get('kidId'))
  const rewardId = Number(formData.get('rewardId'))
  if (!kidId || !rewardId) throw new Error('Datos inválidos')

  const [r] = await db.select().from(rewards).where(eq(rewards.id, rewardId))
  if (!r || !r.active) throw new Error('Recompensa no disponible')

  const balances = await kidBalances()
  if ((balances.get(kidId) ?? 0) < r.costCents) throw new Error('Saldo insuficiente')

  await db.insert(redemptions).values({
    kidId,
    rewardId: r.id,
    rewardName: r.name,
    rewardIcon: r.icon,
    costCents: r.costCents,
  })
  refresh()
}

// ── Sesión ───────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const pin = String(formData.get('pin') ?? '')
  if (!pinMatches(pin, process.env.COLABORO_PIN)) {
    redirect('/login?e=1')
  }
  const token = await makeSessionToken(process.env.COLABORO_SECRET!)
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
  redirect('/')
}

export async function logout() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
  redirect('/login')
}
