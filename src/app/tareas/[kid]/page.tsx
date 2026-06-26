import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { unitWord, moneyOf, themeOf } from '@/lib/money'
import {
  deleteKid,
  enterKid,
  setGoal,
  setIconStyle,
  setKidAvatar,
  setKidColor,
  setKidEmoji,
  setKidPin,
  setPointsName,
  setTheme,
  setUnit,
  updateKid,
} from '@/app/actions'
import { AVATAR_STYLES, avatarDataUri } from '@/lib/avatars'
import { Nav } from '@/components/Nav'
import { TaskGlyph } from '@/components/TaskGlyph'
import { ICON_CATALOG, iconColor, type IconStyle } from '@/lib/icons'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { EmojiInput } from '@/components/EmojiInput'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ColorPicker } from '@/components/ColorPicker'

export const dynamic = 'force-dynamic'

const KID_EMOJIS = [
  '😀', '😎', '🤩', '🥳', '😺', '🦁', '🦊', '🐯', '🐻', '🐼', '🐨', '🐸',
  '🐵', '🦄', '🐶', '🐱', '🐰', '🐲', '🦖', '🐙', '🦋', '🦉', '🐳', '🦈',
  '🤖', '👾', '👻', '🚀', '⚽', '🎮', '🍕', '🌟',
]
const POINT_ICONS = ['💎', '⭐', '🪙', '🦃', '⚡', '🏅', '🔶', '🌟', '🍪', '🔥']
const GOAL_ICONS = ['🎯', '🚲', '🎮', '📱', '🧸', '🎧', '⚽', '🛹', '📚', '🎨', '🎟️', '🐶', '🍕', '🎂']
const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'
const ICON_PREVIEW_PASTELS = ['#f7d0e0', '#cfe0f5', '#dde7dd', '#f2ecc9', '#ddd6f0', '#f3d4e1', '#d2d8f0', '#d6e1d6', '#e3e3c5', '#c5cfe2']

export default async function KidSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ kid: string }>
  searchParams: Promise<{ pin?: string; av?: string; avs?: string }>
}) {
  const { kid } = await params
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const kids = await getActiveKids(accountId)
  const k = kids.find((x) => x.id === Number(kid))
  if (!k) redirect('/tareas')

  const money = moneyOf(k)
  const theme = themeOf(k)
  const allIcons = ICON_CATALOG.flatMap((c) => c.icons)

  // Avatar: un emoji o un personaje generado. Se elige el tipo y se ven variantes.
  const avSalt = Number(sp.av) > 0 ? Number(sp.av) : 1
  const isStyle = !!sp.avs && AVATAR_STYLES.some((s) => s.key === sp.avs)
  const avsKey = isStyle ? (sp.avs as string) : sp.avs === 'emoji' ? 'emoji' : AVATAR_STYLES[0].key
  const avatarOptions =
    avsKey === 'emoji'
      ? []
      : Array.from({ length: 20 }, (_, i) => {
          const seed = `${k.name}-${avSalt}-${i}`
          return { seed, uri: avatarDataUri(avsKey, seed)! }
        })

  const unitPill = (on: boolean) =>
    `tap-bounce rounded-xl border-2 px-4 py-1.5 font-display text-sm font-bold ${
      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
    }`
  const themePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl border-2 px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
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

        {/* Editar hijo: nombre + foto */}
        <form action={updateKid} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <input type="hidden" name="id" value={k.id} />
          <div className="flex items-center gap-3">
            <AvatarUpload emoji={k.emoji} initialUrl={k.avatarUrl} />
            <div className="flex-1 space-y-2">
              <input name="name" defaultValue={k.name} className={`${inputCls} font-display font-bold`} />
              <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                Guardar nombre
              </SubmitButton>
            </div>
          </div>
        </form>

        {/* Avatar: emoji o personaje */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">🎭 Avatar</span>
          <p className="text-[11px] text-[var(--ink-3)]">
            La carita de {k.name}: un emoji o un personaje. Elige el tipo y toca uno.
          </p>

          {/* Tipos: Emoji + estilos de personaje (varias filas, sin scroll) */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...AVATAR_STYLES.slice(0, 3), { key: 'emoji', label: 'Emoji' }, ...AVATAR_STYLES.slice(3)].map((s) => {
              const on = s.key === avsKey
              return (
                <Link
                  key={s.key}
                  href={`/tareas/${k.id}?avs=${s.key}&av=${avSalt}`}
                  replace
                  scroll={false}
                  className={`tap-bounce rounded-full px-3 py-1 text-xs font-bold ${
                    on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
                  }`}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>

          {avsKey === 'emoji' ? (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {KID_EMOJIS.map((em) => {
                const on = !k.avatarUrl && k.emoji === em
                return (
                  <form key={em} action={setKidEmoji}>
                    <input type="hidden" name="kidId" value={k.id} />
                    <input type="hidden" name="emoji" value={em} />
                    <button
                      className={`tap-bounce flex aspect-square w-full items-center justify-center rounded-2xl text-4xl ${
                        on ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-[var(--card)] hover:bg-indigo-50'
                      }`}
                    >
                      {em}
                    </button>
                  </form>
                )
              })}
            </div>
          ) : (
            <>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {avatarOptions.map((o) => (
                  <form key={o.seed} action={setKidAvatar}>
                    <input type="hidden" name="kidId" value={k.id} />
                    <input type="hidden" name="avStyle" value={avsKey} />
                    <input type="hidden" name="seed" value={o.seed} />
                    <button className="tap-bounce flex w-full items-center justify-center rounded-2xl border-2 border-indigo-100 p-1 hover:border-indigo-400">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.uri} alt="" width={52} height={52} className="rounded-full" />
                    </button>
                  </form>
                ))}
              </div>
              <Link
                href={`/tareas/${k.id}?avs=${avsKey}&av=${avSalt + 1}`}
                replace
                scroll={false}
                className="tap-bounce mt-2 inline-block rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600"
              >
                🎲 Ver otras caras
              </Link>
            </>
          )}
        </div>

        {/* Color */}
        <form action={setKidColor} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <input type="hidden" name="kidId" value={k.id} />
          <span className="font-display text-sm font-bold text-[var(--ink)]">🎨 Color</span>
          <p className="text-[11px] text-[var(--ink-3)]">Color de {k.name} en el tablero y las tarjetas.</p>
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <ColorPicker name="color" defaultValue={k.color} />
            </div>
            <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Guardar
            </SubmitButton>
          </div>
        </form>

        {/* Diseño */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">Diseño</span>
          <div className="mt-2 flex gap-2">
            <form action={setTheme} className="flex-1">
              <input type="hidden" name="kidId" value={k.id} />
              <input type="hidden" name="theme" value="infantil" />
              <button className={themePill(theme === 'infantil')}>☀️ Claro</button>
            </form>
            <form action={setTheme} className="flex-1">
              <input type="hidden" name="kidId" value={k.id} />
              <input type="hidden" name="theme" value="juvenil" />
              <button className={themePill(theme === 'juvenil')}>🌙 Oscuro</button>
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

        {/* Estilo de los iconos de las tareas */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">Estilo de los iconos</span>
          <p className="text-[11px] text-[var(--ink-3)]">Cómo se ven los iconos de las tareas de {k.name}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['emoji', 'Emoji'],
                ['line', 'Línea'],
                ['fill', 'Relleno'],
                ['openmoji', 'Pegatina'],
                ['game', 'Gamer'],
                ['dibujos', 'Dibujos'],
              ] as const
            ).map(([val, label]) => {
              const on = k.iconStyle === val
              return (
                <form key={val} action={setIconStyle} className="shrink-0">
                  <input type="hidden" name="kidId" value={k.id} />
                  <input type="hidden" name="iconStyle" value={val} />
                  <button
                    className={`tap-bounce flex w-[78px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 ${
                      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
                    }`}
                  >
                    <span className="flex h-7 items-center justify-center">
                      <TaskGlyph iconKey="broom" emoji="🧹" style={val as IconStyle} size={26} color={on ? '#fff' : '#3f3f55'} />
                    </span>
                    <span className="font-display text-xs font-bold">{label}</span>
                  </button>
                </form>
              )
            })}
          </div>

          <div className="mt-3 border-t-2 border-indigo-50 pt-2">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Todos los iconos en este estilo:</span>
            <div className="mt-1.5 grid max-h-60 grid-cols-7 gap-1.5 overflow-y-auto">
              {allIcons.map((ic, i) => {
                const bg = ICON_PREVIEW_PASTELS[i % ICON_PREVIEW_PASTELS.length]
                return (
                  <span
                    key={ic.key}
                    title={ic.label}
                    className="flex aspect-square items-center justify-center rounded-xl shadow-inner"
                    style={{ background: bg }}
                  >
                    <TaskGlyph iconKey={ic.key} emoji={ic.emoji} style={k.iconStyle as IconStyle} size={24} color={iconColor(bg)} />
                  </span>
                )
              })}
            </div>
          </div>
        </div>

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

        {/* Modo niño: PIN + entrar */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">📱 Modo niño</span>
          <p className="text-[11px] text-[var(--ink-3)]">
            PIN opcional de 4 dígitos para {k.name} (evita que al cambiar de hermano se cuele en otra cuenta). Déjalo
            vacío para no pedir PIN.
          </p>
          <form action={setKidPin} className="mt-2 flex items-end gap-2">
            <input type="hidden" name="kidId" value={k.id} />
            <label className="flex-1">
              <span className="text-[11px] font-semibold text-[var(--ink-3)]">PIN (4 dígitos)</span>
              <input
                name="pin"
                inputMode="numeric"
                maxLength={4}
                defaultValue={k.pin ?? ''}
                placeholder="sin PIN"
                className={`${inputCls} tracking-[0.3em]`}
              />
            </label>
            <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Guardar
            </SubmitButton>
          </form>
          {sp.pin === 'ok' && <p className="mt-1 text-[11px] font-bold text-emerald-600">✓ PIN guardado.</p>}
          {sp.pin === 'short' && <p className="mt-1 text-[11px] font-bold text-rose-500">El PIN debe tener 4 dígitos.</p>}
          <form action={enterKid} className="mt-2">
            <input type="hidden" name="kidId" value={k.id} />
            <SubmitButton className="tap-bounce w-full rounded-xl border-2 border-indigo-200 py-2 font-display text-sm font-bold text-indigo-600">
              Entrar en modo niño como {k.name} →
            </SubmitButton>
          </form>
        </div>

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
