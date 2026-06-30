'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  accounts,
  kids,
  tasks,
  completions,
  payouts,
  rewards,
  redemptions,
  pushSubscriptions,
} from '@/lib/db/schema'
import { parseEurosToCents } from '@/lib/money'
import { kidBalances } from '@/lib/data'
import { sendToAccount } from '@/lib/push'
import { ICON_BY_KEY } from '@/lib/icons'
import { REWARD_BY_KEY } from '@/lib/reward-icons'
import { avatarDataUri } from '@/lib/avatars'
import { hashPassword, verifyPassword } from '@/lib/password'
import { SESSION_COOKIE, KID_COOKIE, makeSessionToken, makeKidToken } from '@/lib/auth'
import { getViewer, getKidMode, requireAccount } from '@/lib/session'

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

// Hijo que realiza la acción: en modo niño se fuerza al hijo de la sesión;
// como padre, el del formulario (validando que es suyo).
async function actingKid(formKidId: number): Promise<{ accountId: number; kidId: number }> {
  const v = await getViewer()
  if (!v) throw new Error('No autorizado')
  const kidId = v.isKid ? v.kidId! : formKidId
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(v.accountId, kidId)
  return { accountId: v.accountId, kidId }
}

async function setKidCookie(accountId: number, kidId: number) {
  const token = await makeKidToken(process.env.COLABORO_SECRET!, accountId, kidId)
  const c = await cookies()
  c.set(KID_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
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

// ── Modo niño ────────────────────────────────────────────────────────
// Entra en modo niño (kiosco) como un hijo. Solo desde la cuenta del padre:
// en modo niño NO se puede cambiar de hijo (cada uno solo toca lo suyo).
export async function enterKid(formData: FormData) {
  const v = await getViewer()
  if (!v) throw new Error('No autorizado')
  if (v.isKid) redirect('/') // en modo niño no se cambia de hijo
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  const [k] = await db
    .select({ id: kids.id })
    .from(kids)
    .where(and(eq(kids.id, kidId), eq(kids.accountId, v.accountId), eq(kids.active, true)))
  if (!k) throw new Error('No autorizado')
  await setKidCookie(v.accountId, kidId)
  const c = await cookies()
  c.delete(SESSION_COOKIE) // excluyente: se sale de la cuenta del padre
  redirect('/')
}

export async function exitKidMode(formData: FormData) {
  const kid = await getKidMode() // sabemos la cuenta del padre por el token de niño
  if (!kid) redirect('/login')
  // Para volver al panel del padre se exige su contraseña (que un niño no sabe).
  const password = String(formData.get('password') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, kid.accountId))
  if (!acc || !verifyPassword(password, acc.passwordHash)) redirect('/salir?e=bad')
  const c = await cookies()
  c.delete(KID_COOKIE)
  await setSessionCookie(kid.accountId) // reabre la sesión del padre, sin re-login completo
  redirect('/')
}

export async function setKidPin(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  const raw = String(formData.get('pin') ?? '').trim()
  const pin = raw === '' ? null : raw.replace(/\D/g, '').slice(0, 4)
  if (pin !== null && pin.length < 4) redirect(`/tareas/${kidId}?pin=short`)
  await db.update(kids).set({ pin }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  redirect(`/tareas/${kidId}?pin=ok`)
}

// ── Avisos push ──────────────────────────────────────────────────────
export async function saveSubscription(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const accountId = await requireAccount()
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error('Suscripción inválida')
  await db
    .insert(pushSubscriptions)
    .values({ accountId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { accountId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    })
}

export async function removeSubscription(endpoint: string) {
  const accountId = await requireAccount()
  if (!endpoint) return
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.accountId, accountId)))
}

// ── Tareas por defecto para un hijo nuevo ────────────────────────────
// [nombre, descripción, emoji, iconKey, valorCents, vecesSemana, color]
const DEFAULT_TASKS = [
  ['Aspirador casa', 'cocina + habitaciones + salón + pasillo', '🧹', 'broom', 100, 7, '#f7d0e0'],
  ['Cuarto de baño', 'aspirar, lavabo, váter, bañera, espejo, fregar suelo', '🚽', 'toilet', 100, 2, '#cfe0f5'],
  ['Aspirar entrada', 'aspirar alfombra y suelo, limpiar polvo', '🚪', 'door', 100, 7, '#dde7dd'],
  ['Cristales', 'limpiar polvo, despacho + salón + habitaciones', '🪟', 'sparkle', 100, 2, '#f2ecc9'],
  ['Tender la ropa', 'ropa estirada y bien colocada', '👕', 't-shirt', 100, 7, '#ddd6f0'],
  ['Limpiar el polvo', 'de toda la casa, sacudir plumero cada poco tiempo', '🪶', 'feather', 100, 7, '#f3d4e1'],
  ['Hacer la comida', '', '🍳', 'cooking-pot', 100, 7, '#d2d8f0'],
  ['Recoger ropa tendal', 'dejar ropa organizada', '🧺', 'basket', 100, 7, '#d6e1d6'],
  ['Recoger lavaplatos', 'sacar y colocar', '🍽️', 'fork-knife', 100, 7, '#e3e3c5'],
  ['Tirar la basura', 'orgánico, plásticos, papel y vidrio', '🗑️', 'trash', 50, 7, '#c5cfe2'],
  ['Leer', 'un rato de lectura', '📖', 'book', 100, 7, '#d9e6f2'],
  ['Estudiar', 'deberes y repaso', '🎓', 'graduation-cap', 100, 7, '#e6dcc0'],
  ['No decir palabrotas', 'cuidar el vocabulario todo el día', '🤐', 'prohibit', 100, 7, '#f2d4dd'],
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
      iconKey: t[3],
      valueCents: t[4],
      weeklyTarget: t[5],
      color: t[6],
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
  const v = await getViewer()
  if (!v) throw new Error('No autorizado')
  const kidId = v.isKid ? v.kidId! : Number(formData.get('kidId'))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!kidId || !taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [t] = await db
    .select({ v: tasks.valueCents, name: tasks.name, icon: tasks.icon })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.kidId, kidId), eq(tasks.accountId, v.accountId)))
  if (!t) throw new Error('Tarea no encontrada')

  await db.insert(completions).values({ kidId, taskId, doneOn, valueCents: t.v })
  refresh()

  // En modo niño, avisa al padre (sin bloquear).
  if (v.isKid) {
    const [k] = await db.select({ name: kids.name }).from(kids).where(eq(kids.id, kidId))
    void sendToAccount(v.accountId, {
      title: `${t.icon} Tarea hecha`,
      body: `${k?.name ?? 'Tu hijo'} ha hecho «${t.name}»`,
      url: '/',
    })
  }
}

export async function undoTask(formData: FormData) {
  const { kidId } = await actingKid(Number(formData.get('kidId')))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .where(and(eq(completions.kidId, kidId), eq(completions.taskId, taskId), eq(completions.doneOn, doneOn)))
    .orderBy(desc(completions.id))
    .limit(1)
  if (row) await db.delete(completions).where(eq(completions.id, row.id))
  refresh()
}

// Quita un apunte concreto marcado por error (solo el padre).
// El saldo es calculado (Σ completions − Σ payouts), así que basta con borrar.
export async function removeCompletion(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const [row] = await db
    .select({ id: completions.id, kidId: completions.kidId })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(and(eq(completions.id, id), eq(kids.accountId, accountId)))
  if (row) {
    await db.delete(completions).where(eq(completions.id, row.id))
    // Si la marca ya estaba pagada, el saldo quedaría negativo: lo dejamos en 0.
    const bal = (await kidBalances(accountId)).get(row.kidId) ?? 0
    if (bal < 0) {
      await db.insert(payouts).values({ kidId: row.kidId, amountCents: bal, note: 'Ajuste (marca quitada ya pagada)' })
    }
  }
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
  const ikRaw = String(formData.get('iconKey') ?? '').trim()
  const iconKey = ikRaw && ICON_BY_KEY[ikRaw] ? ikRaw : null

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
    iconKey,
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
  const ikRaw = String(formData.get('iconKey') ?? '').trim()
  const iconKey = ikRaw && ICON_BY_KEY[ikRaw] ? ikRaw : null

  const [row] = await db
    .update(tasks)
    .set({ name, description, icon, iconKey, valueCents, weeklyTarget })
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

// Pone como avatar un "personaje" generado (DiceBear). Reusa avatarUrl.
export async function setKidAvatar(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const style = String(formData.get('avStyle') ?? '')
  const seed = String(formData.get('seed') ?? '')
  if (!kidId || !seed) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  const uri = avatarDataUri(style, seed)
  if (!uri) throw new Error('Estilo no válido')
  await db.update(kids).set({ avatarUrl: uri }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

export async function clearKidAvatar(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  await db.update(kids).set({ avatarUrl: null }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  redirect(`/tareas/${kidId}`)
}

// Usar un EMOJI como avatar (quita la foto/personaje).
export async function setKidEmoji(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const emoji = String(formData.get('emoji') ?? '').trim()
  if (!kidId || !emoji) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  await db
    .update(kids)
    .set({ emoji: emoji.slice(0, 8), avatarUrl: null })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

export async function setKidColor(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const color = String(formData.get('color') ?? '')
  if (!kidId || !/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error('Datos inválidos')
  await assertKid(accountId, kidId)
  await db.update(kids).set({ color }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  refresh()
}

export async function setIconStyle(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  const style = String(formData.get('iconStyle') ?? '')
  if (!kidId || !['emoji', 'line', 'fill', 'openmoji', 'game', 'dibujos'].includes(style))
    throw new Error('Datos inválidos')
  await db.update(kids).set({ iconStyle: style }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
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

  const set: { name: string; emoji?: string; avatarUrl?: string | null; color?: string } = { name }
  const emoji = String(formData.get('emoji') ?? '').trim()
  if (emoji) set.emoji = emoji.slice(0, 8)
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
  const ikRaw = String(formData.get('iconKey') ?? '').trim()
  const iconKey = ikRaw && REWARD_BY_KEY[ikRaw] ? ikRaw : null
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${rewards.sortOrder}),0)::int` })
    .from(rewards)
    .where(and(eq(rewards.accountId, accountId), eq(rewards.kidId, kidId)))
  await db.insert(rewards).values({ accountId, kidId, name, icon, iconKey, costCents, sortOrder: (max ?? 0) + 1 })
  redirect(`/recompensas/editar?kid=${kidId}`)
}

export async function updateReward(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Falta el nombre')
  const icon = String(formData.get('icon') ?? '').trim() || '🎁'
  const ikRaw = String(formData.get('iconKey') ?? '').trim()
  const iconKey = ikRaw && REWARD_BY_KEY[ikRaw] ? ikRaw : null
  const costCents = parseEurosToCents(String(formData.get('cost') ?? '')) ?? 500
  const [row] = await db
    .update(rewards)
    .set({ name, icon, iconKey, costCents })
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
  const { accountId, kidId } = await actingKid(Number(formData.get('kidId')))
  const rewardId = Number(formData.get('rewardId'))
  if (!rewardId) throw new Error('Datos inválidos')

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
