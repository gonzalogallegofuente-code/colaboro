import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { getActiveKids, getAllTasks } from '@/lib/data'
import { getMoneyConfig, getTheme } from '@/lib/settings'
import { requireAccountPage } from '@/lib/session'
import { unitWord } from '@/lib/money'
import {
  addKid,
  addTask,
  changePassword,
  logout,
  setPointsName,
  setTaskActive,
  setTheme,
  setUnit,
  updateKid,
  updateTask,
} from '@/app/actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'
import { EmojiInput } from '@/components/EmojiInput'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ColorPicker } from '@/components/ColorPicker'

export const dynamic = 'force-dynamic'

const TASK_ICONS = ['🧹', '🚽', '🚪', '🪟', '👕', '🪶', '🍳', '🧺', '🍽️', '🗑️', '🛏️', '🌱', '🐕', '📚', '🧽', '♻️']
const KID_EMOJIS = ['🦁', '🦊', '🐯', '🐻', '🐼', '🦄', '🚀', '⚽', '🎮', '🦖', '🐶', '🐱']
const POINT_ICONS = ['💎', '⭐', '🪙', '🦃', '⚡', '🏅', '🔶', '🌟', '🍪', '🔥']

const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

function eurosInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string; pw?: string }>
}) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const [kids, money, theme, accRows] = await Promise.all([
    getActiveKids(accountId),
    getMoneyConfig(accountId),
    getTheme(accountId),
    db.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)),
  ])
  const accEmail = accRows[0]?.email ?? ''
  const selKid = kids.find((k) => k.id === Number(sp.kid)) ?? kids[0]
  const tasks = selKid ? await getAllTasks(accountId, selKid.id) : []

  const unitPill = (on: boolean) =>
    `tap-bounce rounded-xl px-4 py-1.5 font-display text-sm font-bold ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`
  const themePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">⚙️ Ajustes</h1>

      {/* Diseño según la edad */}
      <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">Diseño</span>
        <div className="mt-2 flex gap-2">
          <form action={setTheme} className="flex-1">
            <input type="hidden" name="theme" value="infantil" />
            <button className={themePill(theme === 'infantil')}>
              🧸 Infantil
              <span className="block text-[11px] font-normal opacity-80">hasta 9 años</span>
            </button>
          </form>
          <form action={setTheme} className="flex-1">
            <input type="hidden" name="theme" value="juvenil" />
            <button className={themePill(theme === 'juvenil')}>
              🎮 Juvenil
              <span className="block text-[11px] font-normal opacity-80">10 años en adelante</span>
            </button>
          </form>
        </div>
      </div>

      {/* Unidad */}
      <div className="mx-3 mt-2 flex items-center gap-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">Contar en:</span>
        <form action={setUnit}>
          <input type="hidden" name="unit" value="eur" />
          <button className={unitPill(money.unit === 'eur')}>🪙 Euros</button>
        </form>
        <form action={setUnit}>
          <input type="hidden" name="unit" value="pts" />
          <button className={unitPill(money.unit === 'pts')}>{money.pointsIcon} Puntos</button>
        </form>
      </div>

      {/* Nombre de los puntos */}
      <form action={setPointsName} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">¿Cómo se llaman los puntos?</span>
        <div className="mt-2 flex items-start gap-3">
          <EmojiInput name="pointsIcon" defaultValue={money.pointsIcon} suggestions={POINT_ICONS} />
          <div className="flex-1">
            <input name="pointsName" defaultValue={money.pointsName} className={inputCls} placeholder="gemas" />
            <SubmitButton className="tap-bounce mt-2 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Guardar
            </SubmitButton>
          </div>
        </div>
      </form>

      {/* Editar recompensas */}
      <Link href="/recompensas/editar" className="tap-bounce mx-3 mt-2 flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">🎁 Editar recompensas</span>
        <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
      </Link>

      {/* Hijos */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">🧒 Hijos</h2>
      <div className="mx-3 mt-2 space-y-2.5">
        {kids.map((k) => (
          <form key={k.id} action={updateKid} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <input type="hidden" name="id" value={k.id} />
            <div className="flex items-start gap-3">
              <AvatarUpload emoji={k.emoji} initialUrl={k.avatarUrl} />
              <div className="flex-1 space-y-2">
                <input name="name" defaultValue={k.name} className={`${inputCls} font-display font-bold`} />
                <div>
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Emoji (si no hay foto)</span>
                  <EmojiInput name="emoji" defaultValue={k.emoji} suggestions={KID_EMOJIS} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Color</span>
                  <ColorPicker name="color" defaultValue={k.color} />
                </div>
                <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                  Guardar
                </SubmitButton>
              </div>
            </div>
          </form>
        ))}

        <form action={addKid} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <div className="flex items-center gap-2">
            <EmojiInput name="emoji" defaultValue="🙂" suggestions={KID_EMOJIS} />
            <input name="name" placeholder="Nombre del hijo" className={`${inputCls} flex-1`} required />
          </div>
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Color</span>
            <ColorPicker name="color" defaultValue="#16a34a" />
          </div>
          <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
            Añadir hijo (con tareas de ejemplo)
          </SubmitButton>
        </form>
      </div>

      {/* Tareas por hijo */}
      {selKid && (
        <>
          <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">🧹 Tareas</h2>
          <div className="mt-2 flex gap-2 px-3">
            {kids.map((k) => {
              const on = k.id === selKid.id
              return (
                <Link
                  key={k.id}
                  href={`/tareas?kid=${k.id}`}
                  replace
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-2 shadow-sm ${on ? 'shadow-md ring-2 ring-white' : ''}`}
                  style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
                >
                  <span className="text-xl">{k.emoji}</span>
                  <span className="font-display font-bold">{k.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="mx-3 mt-3 space-y-2.5">
            {tasks.map((t) => (
              <div key={t.id} className={`rounded-3xl bg-[var(--card)] p-3 shadow-md ${t.active ? '' : 'opacity-60'}`}>
                <form action={updateTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icon}</span>
                    <input name="name" defaultValue={t.name} className={`${inputCls} flex-1 font-display font-bold`} placeholder="Nombre" />
                  </div>
                  <input name="description" defaultValue={t.description ?? ''} className={`${inputCls} mt-1.5 text-[var(--ink-2)]`} placeholder="Descripción (opcional)" />
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
                    <EmojiInput name="icon" defaultValue={t.icon} suggestions={TASK_ICONS} />
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <label className="flex-1">
                      <span className="text-[11px] font-semibold text-[var(--ink-3)]">Valor ({unitWord(money)})</span>
                      <input name="value" defaultValue={eurosInput(t.valueCents)} inputMode="decimal" className={inputCls} />
                    </label>
                    <label className="flex-1">
                      <span className="text-[11px] font-semibold text-[var(--ink-3)]">Veces/semana</span>
                      <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={t.weeklyTarget} className={inputCls} />
                    </label>
                  </div>
                  <SubmitButton className="tap-bounce mt-2.5 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                    Guardar
                  </SubmitButton>
                </form>
                <ToggleActive id={t.id} active={t.active} />
              </div>
            ))}

            {/* Añadir tarea para este hijo */}
            <form action={addTask} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
              <input type="hidden" name="kidId" value={selKid.id} />
              <input name="name" placeholder={`Nueva tarea para ${selKid.name}`} className={`${inputCls} font-display font-bold`} required />
              <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
              <div className="mt-2">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
                <EmojiInput name="icon" defaultValue="⭐" suggestions={TASK_ICONS} />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <label className="flex-1">
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Valor ({unitWord(money)})</span>
                  <input name="value" defaultValue="1" inputMode="decimal" className={inputCls} />
                </label>
                <label className="flex-1">
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Veces/semana</span>
                  <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={7} className={inputCls} />
                </label>
              </div>
              <SubmitButton className="tap-bounce mt-2.5 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
                Añadir tarea
              </SubmitButton>
            </form>
          </div>
        </>
      )}

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
        <form action={logout} className="mt-3">
          <SubmitButton className="rounded-xl border-2 border-gray-200 px-3 py-1.5 text-sm font-semibold text-[var(--ink-2)]">
            Cerrar sesión
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}

function ToggleActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form action={setTaskActive} className="mt-2 text-right">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? '0' : '1'} />
      <SubmitButton className="text-xs font-semibold text-[var(--ink-3)] underline underline-offset-2">
        {active ? 'Ocultar del tablero' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
