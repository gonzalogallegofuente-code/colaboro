import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { unitWord, moneyOf, themeOf } from '@/lib/money'
import { deleteKid, setGoal, setPointsName, setTheme, setUnit, updateKid } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { EmojiInput } from '@/components/EmojiInput'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ColorPicker } from '@/components/ColorPicker'

export const dynamic = 'force-dynamic'

const KID_EMOJIS = ['🦁', '🦊', '🐯', '🐻', '🐼', '🦄', '🚀', '⚽', '🎮', '🦖', '🐶', '🐱']
const POINT_ICONS = ['💎', '⭐', '🪙', '🦃', '⚡', '🏅', '🔶', '🌟', '🍪', '🔥']
const GOAL_ICONS = ['🎯', '🚲', '🎮', '📱', '🧸', '🎧', '⚽', '🛹', '📚', '🎨', '🎟️', '🐶', '🍕', '🎂']
const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

export default async function KidSettingsPage({ params }: { params: Promise<{ kid: string }> }) {
  const { kid } = await params
  const accountId = await requireAccountPage()
  const kids = await getActiveKids(accountId)
  const k = kids.find((x) => x.id === Number(kid))
  if (!k) redirect('/tareas')

  const money = moneyOf(k)
  const theme = themeOf(k)

  const unitPill = (on: boolean) =>
    `tap-bounce rounded-xl px-4 py-1.5 font-display text-sm font-bold ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`
  const themePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <div className="flex items-center justify-between px-4 pt-2">
          <h1 className="font-display text-xl font-bold text-[var(--head)]">⚙️ {k.name}</h1>
          <Link href="/tareas" className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
            ← Ajustes
          </Link>
        </div>

        {/* Editar hijo */}
        <form action={updateKid} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
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

        {/* Diseño */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">Diseño</span>
          <div className="mt-2 flex gap-2">
            <form action={setTheme} className="flex-1">
              <input type="hidden" name="kidId" value={k.id} />
              <input type="hidden" name="theme" value="infantil" />
              <button className={themePill(theme === 'infantil')}>
                🧸 Infantil
                <span className="block text-[11px] font-normal opacity-80">hasta 9 años</span>
              </button>
            </form>
            <form action={setTheme} className="flex-1">
              <input type="hidden" name="kidId" value={k.id} />
              <input type="hidden" name="theme" value="juvenil" />
              <button className={themePill(theme === 'juvenil')}>
                🎮 Juvenil
                <span className="block text-[11px] font-normal opacity-80">10 años en adelante</span>
              </button>
            </form>
          </div>
        </div>

        {/* Forma de contar */}
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">Contar en:</span>
          <form action={setUnit}>
            <input type="hidden" name="kidId" value={k.id} />
            <input type="hidden" name="unit" value="eur" />
            <button className={unitPill(money.unit === 'eur')}>🪙 Euros</button>
          </form>
          <form action={setUnit}>
            <input type="hidden" name="kidId" value={k.id} />
            <input type="hidden" name="unit" value="pts" />
            <button className={unitPill(money.unit === 'pts')}>{money.pointsIcon} Puntos</button>
          </form>
        </div>

        <form action={setPointsName} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <input type="hidden" name="kidId" value={k.id} />
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

        {/* Meta de ahorro */}
        <form action={setGoal} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <input type="hidden" name="kidId" value={k.id} />
          <span className="font-display text-sm font-bold text-[var(--ink)]">🎯 Meta de ahorro</span>
          <p className="text-[11px] text-[var(--ink-3)]">
            Un objetivo al que ahorrar; aparece con barra de progreso en el tablero. Déjalo vacío para quitarla.
          </p>
          <div className="mt-2 flex items-start gap-3">
            <EmojiInput name="goalIcon" defaultValue={k.goalIcon ?? '🎯'} suggestions={GOAL_ICONS} />
            <div className="flex-1 space-y-2">
              <input name="goalName" defaultValue={k.goalName ?? ''} placeholder="p. ej. Bici nueva" className={inputCls} />
              <label className="block">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Coste ({unitWord(money)})</span>
                <input
                  name="goalCost"
                  defaultValue={k.goalCostCents ? (k.goalCostCents / 100).toString().replace('.', ',') : ''}
                  inputMode="decimal"
                  placeholder="30"
                  className={inputCls}
                />
              </label>
              <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                Guardar meta
              </SubmitButton>
            </div>
          </div>
        </form>

        {/* Editar tareas / recompensas (pantallas con selector de hijo) */}
        <Link
          href={`/tareas/editar?kid=${k.id}`}
          className="tap-bounce mx-3 mt-2 flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md"
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">🧹 Editar tareas</span>
          <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
        </Link>
        <Link
          href={`/recompensas/editar?kid=${k.id}`}
          className="tap-bounce mx-3 mt-2 flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md"
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">🎁 Editar recompensas</span>
          <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
        </Link>

        {/* Borrar hijo */}
        <form action={deleteKid} className="mx-3 mt-8">
          <input type="hidden" name="id" value={k.id} />
          <ConfirmSubmit
            message={`¿Seguro que quieres BORRAR a ${k.name}? Se eliminarán sus tareas, recompensas y todo su historial. No se puede deshacer.`}
            className="w-full rounded-2xl border-2 border-red-200 px-3 py-2 text-sm font-bold text-red-500"
          >
            🗑️ Borrar a {k.name}
          </ConfirmSubmit>
        </form>
      </div>
    </ThemeShell>
  )
}
