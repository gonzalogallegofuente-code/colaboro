import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { addKid, changePassword, deleteAccount, logout, setFamilyGoal } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { AutoForm } from '@/components/AutoForm'
import { ConfirmButton } from '@/components/ConfirmButton'
import { RegisterFingerprint } from '@/components/RegisterFingerprint'

export const dynamic = 'force-dynamic'

const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ pw?: string; del?: string }> }) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const [kids, accRows] = await Promise.all([
    getActiveKids(accountId),
    db
      .select({
        email: accounts.email,
        famTarget: accounts.familyGoalTarget,
        famReward: accounts.familyGoalReward,
      })
      .from(accounts)
      .where(eq(accounts.id, accountId)),
  ])
  const accEmail = accRows[0]?.email ?? ''
  const famTarget = accRows[0]?.famTarget ?? null
  const famReward = accRows[0]?.famReward ?? ''
  const theme = 'infantil' // Ajustes siempre en tono claro (no hereda del hijo)

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">⚙️ Ajustes</h1>
        <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">
          Elige un hijo para ajustar su diseño, su forma de contar, sus tareas y sus recompensas.
        </p>

        {/* Niños → cada uno a sus ajustes */}
        <div className="mx-3 mt-3 space-y-2.5">
          {kids.map((k) => (
            <Link
              key={k.id}
              href={`/tareas/${k.id}`}
              className="tap-bounce flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${k.color}22` }}
              >
                <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={40} />
              </span>
              <div className="flex-1">
                <div className="font-display text-lg font-bold" style={{ color: k.color }}>
                  {k.name}
                </div>
                <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                  {k.theme === 'juvenil' ? '🌙 Oscuro' : '☀️ Claro'} ·{' '}
                  {k.unit === 'pts' ? `⭐ ${k.pointsName}` : '🪙 Euros'}
                </div>
              </div>
              <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
            </Link>
          ))}

          {/* Añadir hijo */}
          <form action={addKid} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
            <span className="font-display text-sm font-bold text-[var(--ink)]">➕ Añadir hijo</span>
            <input name="name" placeholder="Nombre del hijo" className={`${inputCls} mt-2 font-display font-bold`} required />
            <p className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
              Su emoji, color y avatar se eligen después, en los ajustes del hijo.
            </p>
            <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
              Añadir (con tareas de ejemplo)
            </SubmitButton>
          </form>
        </div>

        {/* Objetivo familiar */}
        <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">👨‍👩‍👧‍👦 Objetivo familiar</h2>
        <AutoForm action={setFamilyGoal} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <p className="mb-2 text-[11px] font-semibold text-[var(--ink-3)]">
            Un reto de equipo: si ENTRE TODOS llegáis a N tareas esta semana (lunes a domingo), hay premio compartido.
            Sale en el tablero de todos. Se guarda solo; deja el número vacío para quitarlo.
          </p>
          <div className="flex items-end gap-2">
            <label className="w-28">
              <span className="text-[11px] font-semibold text-[var(--ink-3)]">Tareas/semana</span>
              <input
                name="target"
                type="number"
                min={0}
                defaultValue={famTarget ?? ''}
                placeholder="20"
                className={inputCls}
              />
            </label>
            <label className="flex-1">
              <span className="text-[11px] font-semibold text-[var(--ink-3)]">Premio</span>
              <input name="reward" defaultValue={famReward} placeholder="p. ej. 🎬 Peli con palomitas" className={inputCls} />
            </label>
          </div>
        </AutoForm>

        {/* Sugerencias y peticiones */}
        <Link
          href="/sugerencias"
          className="tap-bounce mx-3 mt-4 flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md"
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">💡 Sugerencias y peticiones</span>
          <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
        </Link>

        {/* Cuenta — subdividida en tarjetas independientes */}
        <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">👤 Cuenta</h2>

        {/* Datos de la cuenta */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <p className="text-sm text-[var(--ink-2)]">
            Conectado como <span className="font-bold text-[var(--ink)]">{accEmail}</span>
          </p>
          <p className="mt-1">
            <Link href="/privacidad" className="text-xs font-bold text-indigo-600 underline underline-offset-2">
              🔒 Política de privacidad y tus datos
            </Link>
          </p>
        </div>

        {/* Cambiar contraseña */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">🔑 Cambiar contraseña</span>
          <form action={changePassword} className="mt-2 space-y-2">
            <input name="current" type="password" placeholder="Contraseña actual" className={inputCls} required />
            <input name="next" type="password" placeholder="Nueva contraseña (mín. 6)" className={inputCls} required />
            {sp.pw === 'ok' && <p className="text-xs font-semibold text-emerald-600">Contraseña cambiada ✓</p>}
            {sp.pw === 'bad' && <p className="text-xs font-semibold text-red-600">La contraseña actual no es correcta</p>}
            {sp.pw === 'short' && <p className="text-xs font-semibold text-red-600">La nueva debe tener al menos 6 caracteres</p>}
            <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Cambiar contraseña
            </SubmitButton>
          </form>
        </div>

        {/* Activar huella */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">👆 Huella</span>
          <RegisterFingerprint />
        </div>

        {/* Cerrar sesión */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <form action={logout}>
            <ConfirmButton
              message="¿Seguro que quieres cerrar sesión?"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-semibold text-[var(--ink-2)]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar sesión
            </ConfirmButton>
          </form>
        </div>

        {/* Borrar la cuenta (RGPD, supresión) */}
        <div className="mx-3 mt-2 rounded-3xl border-2 border-red-100 bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-red-500">🗑️ Borrar la cuenta</span>
          <p className="mt-0.5 text-[11px] font-semibold text-[var(--ink-3)]">
            Elimina la cuenta y TODOS sus datos (hijos, tareas, historial, logros…). No se puede deshacer.
          </p>
          {sp.del === 'bad' && <p className="mt-1 text-[11px] font-bold text-red-600">La contraseña no es correcta.</p>}
          <form action={deleteAccount} className="mt-2 flex items-end gap-2">
            <input name="password" type="password" placeholder="Tu contraseña" className={`${inputCls} flex-1`} required />
            <ConfirmButton
              message="¿BORRAR la cuenta y todos sus datos? Esta acción es definitiva y no se puede deshacer."
              className="shrink-0 rounded-xl border-2 border-red-300 px-3 py-1.5 text-sm font-bold text-red-500"
            >
              Borrar
            </ConfirmButton>
          </form>
        </div>
      </div>
    </ThemeShell>
  )
}
