import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { addKid, changePassword, logout } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmButton } from '@/components/ConfirmButton'
import { RegisterFingerprint } from '@/components/RegisterFingerprint'

export const dynamic = 'force-dynamic'

const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ pw?: string }> }) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const [kids, accRows] = await Promise.all([
    getActiveKids(accountId),
    db.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)),
  ])
  const accEmail = accRows[0]?.email ?? ''
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

        {/* Sugerencias y peticiones */}
        <Link
          href="/sugerencias"
          className="tap-bounce mx-3 mt-4 flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md"
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">💡 Sugerencias y peticiones</span>
          <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
        </Link>

        {/* Cuenta */}
        <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">👤 Cuenta</h2>
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <p className="text-sm text-[var(--ink-2)]">
            Conectado como <span className="font-bold text-[var(--ink)]">{accEmail}</span>
          </p>
          <form action={changePassword} className="mt-3 space-y-2">
            <input name="current" type="password" placeholder="Contraseña actual" className={inputCls} required />
            <input name="next" type="password" placeholder="Nueva contraseña (mín. 6)" className={inputCls} required />
            {sp.pw === 'ok' && <p className="text-xs font-semibold text-emerald-600">Contraseña cambiada ✓</p>}
            {sp.pw === 'bad' && <p className="text-xs font-semibold text-red-600">La contraseña actual no es correcta</p>}
            {sp.pw === 'short' && <p className="text-xs font-semibold text-red-600">La nueva debe tener al menos 6 caracteres</p>}
            <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Cambiar contraseña
            </SubmitButton>
          </form>

          <div className="mt-3 border-t border-gray-100 pt-3">
            <span className="font-display text-sm font-bold text-[var(--ink)]">👆 Huella</span>
            <RegisterFingerprint />
          </div>

          <form action={logout} className="mt-3">
            <ConfirmButton
              message="¿Seguro que quieres cerrar sesión?"
              className="rounded-xl border-2 border-gray-200 px-3 py-1.5 text-sm font-semibold text-[var(--ink-2)]"
            >
              Cerrar sesión
            </ConfirmButton>
          </form>
        </div>
      </div>
    </ThemeShell>
  )
}
