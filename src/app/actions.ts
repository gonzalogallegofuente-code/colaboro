'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
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
  suggestions,
  badges,
} from '@/lib/db/schema'
import { isMetric } from '@/lib/badges'
import { parseEurosToCents } from '@/lib/money'
import { kidBalances, getActiveKids, awardEarnedBadges, maybeCelebrateFamilyGoal } from '@/lib/data'
import { sendToAccount } from '@/lib/push'
import { ICON_BY_KEY } from '@/lib/icons'
import { REWARD_BY_KEY } from '@/lib/reward-icons'
import { avatarDataUri } from '@/lib/avatars'
import { hashPassword, verifyPassword } from '@/lib/password'
import { SESSION_COOKIE, KID_COOKIE, makeSessionToken, makeKidToken, pwvOf } from '@/lib/auth'
import { getViewer, getKidMode, requireAccount } from '@/lib/session'
import { rateLimit, rateClear } from '@/lib/ratelimit'
import { sendMail } from '@/lib/mailer'
import { randomBytes, createHash } from 'node:crypto'

// IP del cliente (tras Traefik) para el limitador de intentos.
async function clientIp(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'desconocida'
}

const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

function refresh() {
  revalidatePath('/', 'layout')
}

async function setSessionCookie(accountId: number) {
  const [acc] = await db.select({ passwordHash: accounts.passwordHash }).from(accounts).where(eq(accounts.id, accountId))
  if (!acc) throw new Error('No autorizado')
  const token = await makeSessionToken(process.env.COLABORO_SECRET!, accountId, await pwvOf(acc.passwordHash))
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
  // Registro solo con invitación (INVITE_CODE en el entorno del servidor).
  const invite = String(formData.get('invite') ?? '').trim()
  if (process.env.INVITE_CODE && invite !== process.env.INVITE_CODE) redirect('/registro?e=inv')
  // Aceptación expresa de la política de privacidad (RGPD).
  if (formData.get('acceptPrivacy') !== '1') redirect('/registro?e=priv')
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
  // Máx. 10 intentos fallidos por IP y por email cada 15 minutos.
  const ip = await clientIp()
  if (!rateLimit(`login:ip:${ip}`, 10, 15 * 60_000) || !rateLimit(`login:email:${email}`, 10, 15 * 60_000)) {
    redirect('/login?e=rl')
  }
  const [acc] = await db.select().from(accounts).where(eq(accounts.email, email))
  if (!acc || !verifyPassword(password, acc.passwordHash)) {
    redirect('/login?e=1')
  }
  rateClear(`login:ip:${ip}`)
  rateClear(`login:email:${email}`)
  await setSessionCookie(acc.id)
  redirect('/')
}

export async function logout() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
  redirect('/login')
}

// ── Recuperación de contraseña ───────────────────────────────────────
// Pide el enlace: si el email existe se le envía un enlace de UN SOLO USO que
// caduca en 45 min. La respuesta es siempre la misma (no revela si existe).
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect('/recuperar?ok=1')
  // Freno: 3 peticiones/15 min por email y por IP.
  const ip = await clientIp()
  if (!rateLimit(`reset:ip:${ip}`, 3, 15 * 60_000) || !rateLimit(`reset:email:${email}`, 3, 15 * 60_000)) {
    redirect('/recuperar?ok=1')
  }
  const [acc] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, email))
  if (acc) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await db
      .update(accounts)
      .set({ resetTokenHash: tokenHash, resetExpires: new Date(Date.now() + 45 * 60_000) })
      .where(eq(accounts.id, acc.id))
    const origin = process.env.COLABORO_ORIGIN || 'https://colaboro.srv1532791.hstgr.cloud'
    const url = `${origin}/recuperar/nueva?t=${token}`
    try {
      await sendMail({
        to: email,
        subject: 'Colaboro — recupera tu contraseña',
        text:
          `Hola,\n\nAlguien (esperamos que tú) ha pedido restablecer la contraseña de Colaboro.\n\n` +
          `Entra aquí para poner una nueva (el enlace caduca en 45 minutos y solo vale una vez):\n${url}\n\n` +
          `Si no fuiste tú, ignora este email: tu contraseña sigue igual.`,
      })
    } catch (e) {
      console.error('[recuperar] fallo enviando email:', e)
    }
  }
  redirect('/recuperar?ok=1')
}

// Pone la contraseña nueva a partir del token del email.
export async function resetPassword(formData: FormData) {
  const token = String(formData.get('token') ?? '')
  const next = String(formData.get('password') ?? '')
  if (!/^[0-9a-f]{64}$/.test(token)) redirect('/recuperar?e=link')
  if (next.length < 6) redirect(`/recuperar/nueva?t=${token}&e=short`)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const [acc] = await db.select().from(accounts).where(eq(accounts.resetTokenHash, tokenHash))
  if (!acc || !acc.resetExpires || acc.resetExpires.getTime() < Date.now()) redirect('/recuperar?e=link')
  await db
    .update(accounts)
    .set({ passwordHash: hashPassword(next), resetTokenHash: null, resetExpires: null })
    .where(eq(accounts.id, acc.id))
  // La sesión va ligada a la contraseña (pwv): las demás sesiones caducan solas.
  await setSessionCookie(acc.id)
  redirect('/')
}

export async function changePassword(formData: FormData) {
  const accountId = await requireAccount()
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId))
  if (!acc || !verifyPassword(current, acc.passwordHash)) redirect('/tareas?pw=bad')
  if (next.length < 6) redirect('/tareas?pw=short')
  await db.update(accounts).set({ passwordHash: hashPassword(next) }).where(eq(accounts.id, accountId))
  await setSessionCookie(accountId) // renueva ESTA sesión; las demás quedan invalidadas
  redirect('/tareas?pw=ok')
}

// Borra la cuenta ENTERA con todos sus datos (RGPD: derecho de supresión).
// Pide la contraseña para confirmar. Irreversible.
export async function deleteAccount(formData: FormData) {
  const accountId = await requireAccount()
  const password = String(formData.get('password') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId))
  if (!acc || !verifyPassword(password, acc.passwordHash)) redirect('/tareas?del=bad')

  await db.transaction(async (tx) => {
    // Las marcas primero (su FK a tasks es restrictiva); el resto cae en cascada
    // al borrar la cuenta (hijos, tareas, recompensas, logros, avisos, huellas).
    const kidRows = await tx.select({ id: kids.id }).from(kids).where(eq(kids.accountId, accountId))
    for (const k of kidRows) await tx.delete(completions).where(eq(completions.kidId, k.id))
    await tx.delete(accounts).where(eq(accounts.id, accountId))
  })

  const c = await cookies()
  c.delete(SESSION_COOKIE)
  c.delete(KID_COOKIE)
  redirect('/login')
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
  // Máx. 10 intentos fallidos cada 15 min (que un niño no pruebe sin freno).
  if (!rateLimit(`salir:${kid.accountId}`, 10, 15 * 60_000)) redirect('/salir?e=rl')
  // Para volver al panel del padre se exige su contraseña (que un niño no sabe).
  const password = String(formData.get('password') ?? '')
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, kid.accountId))
  if (!acc || !verifyPassword(password, acc.passwordHash)) redirect('/salir?e=bad')
  rateClear(`salir:${kid.accountId}`)
  const c = await cookies()
  c.delete(KID_COOKIE)
  await setSessionCookie(kid.accountId) // reabre la sesión del padre, sin re-login completo
  redirect('/')
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

// ── Sugerencias y peticiones ─────────────────────────────────────────
// Se guardan en BD y se avisa por push a la cuenta "dueña" (por defecto la 1).
export async function sendSuggestion(formData: FormData) {
  await requireAccount() // hay que estar dentro, pero…
  const text = String(formData.get('text') ?? '').trim().slice(0, 2000)
  if (!text) redirect('/sugerencias')
  // …no se guarda QUIÉN la envía: la sugerencia es anónima de verdad.
  await db.insert(suggestions).values({ text })
  const ownerId = Number(process.env.SUGGESTIONS_ACCOUNT_ID) || 1
  void sendToAccount(ownerId, { title: '💡 Nueva sugerencia', body: text.slice(0, 120), url: '/sugerencias' })
  redirect('/sugerencias?sent=1')
}

// ── Logros / medallas (editables por cuenta) ─────────────────────────
// Vuelve a la pantalla de edición conservando el hijo desde el que se abrió.
function badgesBack(formData: FormData): never {
  const kid = Number(formData.get('kid'))
  redirect(kid ? `/logros/editar?kid=${kid}` : '/logros/editar')
}

export async function addBadge(formData: FormData) {
  const accountId = await requireAccount()
  const metric = String(formData.get('metric') ?? 'tasks')
  const threshold = Math.max(1, Math.round(Number(formData.get('threshold')) || 1))
  const icon = String(formData.get('icon') ?? '🏅').trim().slice(0, 8) || '🏅'
  const label = String(formData.get('label') ?? '').trim().slice(0, 40) || 'Logro'
  const rewardCents = parseEurosToCents(String(formData.get('reward') ?? '')) ?? 0
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${badges.sortOrder}),0)::int` })
    .from(badges)
    .where(eq(badges.accountId, accountId))
  await db.insert(badges).values({
    accountId,
    metric: isMetric(metric) ? metric : 'tasks',
    threshold,
    icon,
    label,
    rewardCents,
    sortOrder: (max ?? 0) + 1,
  })
  // Si algún hijo ya cumplía la meta, se le abona el premio ahora.
  for (const k of await getActiveKids(accountId)) await awardEarnedBadges(accountId, k.id)
  badgesBack(formData)
}

export async function updateBadge(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const metric = String(formData.get('metric') ?? 'tasks')
  const threshold = Math.max(1, Math.round(Number(formData.get('threshold')) || 1))
  const icon = String(formData.get('icon') ?? '🏅').trim().slice(0, 8) || '🏅'
  const label = String(formData.get('label') ?? '').trim().slice(0, 40) || 'Logro'
  const rewardCents = parseEurosToCents(String(formData.get('reward') ?? '')) ?? 0
  await db
    .update(badges)
    .set({ metric: isMetric(metric) ? metric : 'tasks', threshold, icon, label, rewardCents })
    .where(and(eq(badges.id, id), eq(badges.accountId, accountId)))
  // Si algún hijo ya cumplía la meta, se le abona el premio ahora.
  for (const k of await getActiveKids(accountId)) await awardEarnedBadges(accountId, k.id)
  badgesBack(formData)
}

export async function deleteBadge(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  await db.delete(badges).where(and(eq(badges.id, id), eq(badges.accountId, accountId)))
  badgesBack(formData)
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

  // Lo que marca el NIÑO siempre queda pendiente (sin dinero ni logros) hasta que
  // el padre lo aprueba. Lo que marca el padre desde su panel va directo.
  const pending = v.isKid
  await db.insert(completions).values({ kidId, taskId, doneOn, valueCents: t.v, status: pending ? 'pending' : 'approved' })
  if (!pending) {
    await awardEarnedBadges(v.accountId, kidId) // ¿logro con premio?
    await maybeCelebrateFamilyGoal(v.accountId) // ¿objetivo familiar alcanzado?
  }
  refresh()

  // En modo niño, avisa al padre (sin bloquear).
  if (v.isKid) {
    const [k] = await db.select({ name: kids.name }).from(kids).where(eq(kids.id, kidId))
    void sendToAccount(v.accountId, {
      title: pending ? `${t.icon} Tarea por aprobar` : `${t.icon} Tarea hecha`,
      body: pending
        ? `${k?.name ?? 'Tu hijo'} ha marcado «${t.name}» — espera tu aprobación`
        : `${k?.name ?? 'Tu hijo'} ha hecho «${t.name}»`,
      url: '/',
    })
  }
}

// ── Objetivo familiar (semanal, por cuenta) ──────────────────────────
export async function setFamilyGoal(formData: FormData) {
  const accountId = await requireAccount()
  const target = Math.max(0, Math.round(Number(formData.get('target')) || 0))
  const reward = String(formData.get('reward') ?? '').trim().slice(0, 60)
  if (target > 0 && reward) {
    await db
      .update(accounts)
      .set({ familyGoalTarget: target, familyGoalReward: reward })
      .where(eq(accounts.id, accountId))
  } else {
    // Sin número o sin premio = quitar el objetivo.
    await db
      .update(accounts)
      .set({ familyGoalTarget: null, familyGoalReward: null })
      .where(eq(accounts.id, accountId))
  }
  refresh()
}

// ── Aprobación de tareas marcadas por los niños ──────────────────────
export async function approveCompletion(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const [row] = await db
    .select({ id: completions.id, kidId: completions.kidId })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(and(eq(completions.id, id), eq(kids.accountId, accountId), eq(completions.status, 'pending')))
  if (row) {
    await db.update(completions).set({ status: 'approved' }).where(eq(completions.id, row.id))
    await awardEarnedBadges(accountId, row.kidId) // ahora sí cuenta para logros
    await maybeCelebrateFamilyGoal(accountId) // ¿objetivo familiar alcanzado?
  }
  refresh()
}

export async function rejectCompletion(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .innerJoin(kids, eq(kids.id, completions.kidId))
    .where(and(eq(completions.id, id), eq(kids.accountId, accountId), eq(completions.status, 'pending')))
  if (row) await db.delete(completions).where(eq(completions.id, row.id))
  refresh()
}

export async function undoTask(formData: FormData) {
  const { accountId, kidId } = await actingKid(Number(formData.get('kidId')))
  const taskId = Number(formData.get('taskId'))
  const doneOn = formData.get('doneOn')
  if (!taskId || !isYmd(doneOn)) throw new Error('Datos inválidos')

  const [row] = await db
    .select({ id: completions.id })
    .from(completions)
    .where(and(eq(completions.kidId, kidId), eq(completions.taskId, taskId), eq(completions.doneOn, doneOn)))
    .orderBy(desc(completions.id))
    .limit(1)
  if (row) {
    await db.delete(completions).where(eq(completions.id, row.id))
    // Si esa marca ya estaba pagada, el saldo quedaría negativo: lo dejamos en 0.
    const bal = (await kidBalances(accountId)).get(kidId) ?? 0
    if (bal < 0) {
      await db.insert(payouts).values({ kidId, amountCents: bal, note: 'Ajuste (marca quitada ya pagada)' })
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

// Autoguardado: se llama al salir de cada campo. Silencioso (sin redirect) y
// tolerante — si el nombre está vacío a medio escribir, no toca nada (no rompe).
export async function updateTask(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Datos inválidos')
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return // nombre vacío (a medio editar): no guardar todavía
  const valueCents = parseEurosToCents(String(formData.get('value') ?? '')) ?? 100
  const weeklyTarget = Math.max(1, Math.min(31, Number(formData.get('weeklyTarget')) || 7))
  const description = String(formData.get('description') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || '⭐'
  const ikRaw = String(formData.get('iconKey') ?? '').trim()
  const iconKey = ikRaw && ICON_BY_KEY[ikRaw] ? ikRaw : null

  // inPlan lo gestiona toggleInPlan; la aprobación es siempre para el modo niño.
  await db
    .update(tasks)
    .set({ name, description, icon, iconKey, valueCents, weeklyTarget })
    .where(and(eq(tasks.id, id), eq(tasks.accountId, accountId)))
  refresh()
}

// Mete o saca una tarea del objetivo semanal (un toque, sin pasar por Guardar).
export async function toggleInPlan(formData: FormData) {
  const accountId = await requireAccount()
  const id = Number(formData.get('id'))
  const inPlan = formData.get('inPlan') === '1'
  if (!id) throw new Error('Datos inválidos')
  await db.update(tasks).set({ inPlan }).where(and(eq(tasks.id, id), eq(tasks.accountId, accountId)))
  refresh()
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

// Cómo cuenta la semana ese hijo: 'tareas' (libre) u 'objetivo' (plan acordado).
export async function setWeekMode(formData: FormData) {
  const accountId = await requireAccount()
  const kidId = Number(formData.get('kidId'))
  if (!kidId) throw new Error('Datos inválidos')
  const mode = formData.get('mode') === 'objetivo' ? 'objetivo' : 'tareas'
  await db.update(kids).set({ weekMode: mode }).where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
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
  redirect(`/tareas/${id}?sec=avatar`)
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
    redirect(`/tareas/${kidId}?sec=meta`)
  }
  const icon = String(formData.get('goalIcon') ?? '').trim() || '🎯'
  const cost = parseEurosToCents(String(formData.get('goalCost') ?? '')) ?? 0
  await db
    .update(kids)
    .set({ goalName: name.slice(0, 30), goalIcon: icon.slice(0, 8), goalCostCents: cost })
    .where(and(eq(kids.id, kidId), eq(kids.accountId, accountId)))
  redirect(`/tareas/${kidId}?sec=meta`)
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
