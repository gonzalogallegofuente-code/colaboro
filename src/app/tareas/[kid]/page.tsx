import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { unitWord, moneyOf, themeOf } from '@/lib/money'
import {
  deleteKid,
  enterKid,
  setFamilyGoal,
  setGoal,
  setKidAvatar,
  setKidColor,
  setKidEmoji,
  setPointsName,
  setTheme,
  setUnit,
  updateKid,
} from '@/app/actions'
import { AVATAR_STYLES, avatarDataUri } from '@/lib/avatars'
import { Nav } from '@/components/Nav'
import { TaskGlyph } from '@/components/TaskGlyph'
import { ICON_CATALOG, type IconStyle } from '@/lib/icons'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'
import { AutoForm } from '@/components/AutoForm'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { EmojiInput } from '@/components/EmojiInput'
import { ColorPicker } from '@/components/ColorPicker'
import { PushToggle } from '@/components/PushToggle'
import { Avatar } from '@/components/Avatar'

export const dynamic = 'force-dynamic'

// 60 emojis en tandas de 20, para paginar con "Ver otras caras" como los personajes.
const KID_EMOJIS = [
  '😀', '😎', '🤩', '🥳', '😺', '🦁', '🦊', '🐯', '🐻', '🐼', '🐨', '🐸',
  '🐵', '🦄', '🐶', '🐱', '🐰', '🐲', '🦖', '🐙', '🦋', '🦉', '🐳', '🦈',
  '🤖', '👾', '👻', '🚀', '⚽', '🎮', '🍕', '🌟', '😜', '🤠', '🥷', '🧙',
  '🧚', '🦸', '🦹', '👽', '🐧', '🐢', '🦅', '🦜', '🐝', '🐞', '🦕', '🐬',
  '🐴', '🏀', '🎧', '🎨', '🎸', '🚴', '🛹', '🏆', '🎲', '🧩', '🍩', '🌈',
]
const EMOJIS_POR_TANDA = 20
const POINT_ICONS = ['💎', '⭐', '🪙', '🦃', '⚡', '🏅', '🔶', '🌟', '🍪', '🔥']
const GOAL_ICONS = [
  '🎯', '🚲', '🛴', '🛹', '🎮', '🕹️', '📱', '💻', '⌚', '🎧', '🎸', '🎹', '🥁', '🎤',
  '🧸', '🪀', '🧩', '📚', '🎨', '🖍️', '🎟️', '🎬', '🎡', '🏕️', '⚽', '🏀', '🏓', '🎳',
  '👟', '🎀', '💍', '🐶', '🐱', '🐹', '🍕', '🍔', '🍦', '🍫', '🎂', '🎈', '🚗', '✈️', '🌟',
]
const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

const SEC_TITLES: Record<string, string> = {
  avatar: '🎭 Nombre y avatar',
  color: '🎨 Color y edad',
  moneda: '🪙 Contar en',
  meta: '🎯 Meta de ahorro',
  familiar: '👨‍👩‍👧‍👦 Objetivo familiar',
  modo: '📱 Modo niño',
}

// Cabecera de grupo dentro del menú de ajustes del hijo.
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-2 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)]">{children}</h2>
  )
}

// Botón que abre una sub-pantalla de ajustes del hijo.
function SettingRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="tap-bounce flex items-center justify-between rounded-3xl bg-[var(--card)] p-4 shadow-md">
      <span className="font-display text-sm font-bold text-[var(--ink)]">{label}</span>
      <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
    </Link>
  )
}

export default async function KidSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ kid: string }>
  searchParams: Promise<{ av?: string; avs?: string; sec?: string }>
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
  const sec = sp.sec && SEC_TITLES[sp.sec] ? sp.sec : undefined

  // El objetivo familiar es de la CUENTA (compartido por todos los hermanos).
  const [acc] =
    sec === 'familiar'
      ? await db
          .select({ famTarget: accounts.familyGoalTarget, famReward: accounts.familyGoalReward })
          .from(accounts)
          .where(eq(accounts.id, accountId))
      : []

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
  // Los emojis van en tandas de 20, paginadas con "Ver otras caras" (como los personajes).
  const emojiTandas = Math.ceil(KID_EMOJIS.length / EMOJIS_POR_TANDA)
  const emojiDesde = ((avSalt - 1) % emojiTandas) * EMOJIS_POR_TANDA
  const emojiPage = KID_EMOJIS.slice(emojiDesde, emojiDesde + EMOJIS_POR_TANDA)

  const themePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl border-2 px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
    }`

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <div className="flex items-center justify-between px-4 pt-2">
          <h1 className="font-display text-xl font-bold text-[var(--head)]">
            {sec ? SEC_TITLES[sec] : `⚙️ ${k.name}`}
          </h1>
          <Link
            href={sec ? `/tareas/${k.id}` : '/tareas'}
            className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm"
          >
            {sec ? '← Volver' : '← Ajustes'}
          </Link>
        </div>

        {/* ── Menú de ajustes del hijo (lista de botones) ── */}
        {!sec && (
          <>
            <div className="mx-3 mt-1 space-y-2">
              <GroupLabel>Perfil</GroupLabel>
              <SettingRow href={`/tareas/${k.id}?sec=avatar`} label="🎭 Nombre y avatar" />
              <GroupLabel>Aspecto</GroupLabel>
              <SettingRow href={`/tareas/${k.id}?sec=color`} label="🎨 Color y edad" />
              <GroupLabel>Recompensas</GroupLabel>
              <SettingRow href={`/tareas/${k.id}?sec=moneda`} label="🪙 Contar en (euros o puntos)" />
              <SettingRow href={`/tareas/${k.id}?sec=meta`} label="🎯 Meta de ahorro" />
              <SettingRow href={`/tareas/${k.id}?sec=familiar`} label="👨‍👩‍👧‍👦 Objetivo familiar" />
              <SettingRow href={`/recompensas/editar?kid=${k.id}`} label="🎁 Editar recompensas" />
              <SettingRow href={`/logros/editar?kid=${k.id}`} label="🏅 Editar logros" />
              <GroupLabel>Tareas</GroupLabel>
              <SettingRow href={`/tareas/editar?kid=${k.id}`} label="🧹 Editar tareas" />
              <GroupLabel>Modo niño</GroupLabel>
              <SettingRow href={`/tareas/${k.id}?sec=modo`} label="📱 Modo niño y avisos" />
            </div>

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
          </>
        )}

        {/* ── Nombre y avatar ── */}
        {sec === 'avatar' && (
          <>
            <AutoForm action={updateKid} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <input type="hidden" name="id" value={k.id} />
              <span className="font-display text-sm font-bold text-[var(--ink)]">Nombre</span>
              <input name="name" defaultValue={k.name} className={`${inputCls} mt-2 font-display font-bold`} />
              <p className="mt-1 text-[11px] font-semibold text-[var(--ink-3)]">Se guarda solo.</p>
            </AutoForm>

            <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={44} className="shrink-0" />
                <div className="min-w-0">
                  <span className="font-display text-sm font-bold text-[var(--ink)]">🎭 Avatar</span>
                  <p className="text-[11px] text-[var(--ink-3)]">
                    La de la izquierda es la actual. Elige el tipo y toca una para cambiarla.
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...AVATAR_STYLES.slice(0, 3), { key: 'emoji', label: 'Emoji' }, ...AVATAR_STYLES.slice(3)].map((s) => {
                  const on = s.key === avsKey
                  return (
                    <Link
                      key={s.key}
                      href={`/tareas/${k.id}?sec=avatar&avs=${s.key}&av=${avSalt}`}
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
                <>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {emojiPage.map((em) => {
                      const on = !k.avatarUrl && k.emoji === em
                      return (
                        <form key={em} action={setKidEmoji}>
                          <input type="hidden" name="kidId" value={k.id} />
                          <input type="hidden" name="emoji" value={em} />
                          <button
                            className={`tap-bounce flex w-full items-center justify-center rounded-2xl border-2 p-1 ${
                              on
                                ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-500'
                                : 'border-indigo-100 hover:border-indigo-400'
                            }`}
                          >
                            <span className="flex h-[52px] w-[52px] items-center justify-center text-4xl leading-none">{em}</span>
                          </button>
                        </form>
                      )
                    })}
                  </div>
                  <Link
                    href={`/tareas/${k.id}?sec=avatar&avs=emoji&av=${avSalt + 1}`}
                    replace
                    scroll={false}
                    className="tap-bounce mt-2 inline-block rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600"
                  >
                    Ver más caras
                  </Link>
                </>
              ) : (
                <>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {avatarOptions.map((o) => {
                      const on = k.avatarUrl === o.uri
                      return (
                      <form key={o.seed} action={setKidAvatar}>
                        <input type="hidden" name="kidId" value={k.id} />
                        <input type="hidden" name="avStyle" value={avsKey} />
                        <input type="hidden" name="seed" value={o.seed} />
                        <button className={`tap-bounce flex w-full items-center justify-center rounded-2xl border-2 p-1 ${on ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-500' : 'border-indigo-100 hover:border-indigo-400'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={o.uri} alt="" width={52} height={52} className="block h-[52px] w-[52px] rounded-full" />
                        </button>
                      </form>
                      )
                    })}
                  </div>
                  <Link
                    href={`/tareas/${k.id}?sec=avatar&avs=${avsKey}&av=${avSalt + 1}`}
                    replace
                    scroll={false}
                    className="tap-bounce mt-2 inline-block rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600"
                  >
                    Ver más caras
                  </Link>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Color y modo ── */}
        {sec === 'color' && (
          <>
            <form action={setKidColor} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <input type="hidden" name="kidId" value={k.id} />
              <span className="font-display text-sm font-bold text-[var(--ink)]">🎨 Color</span>
              <p className="text-[11px] text-[var(--ink-3)]">Color de {k.name} en el tablero y las tarjetas. Se guarda solo.</p>
              <div className="mt-2">
                <ColorPicker name="color" defaultValue={k.color} autoSubmit />
              </div>
            </form>

            <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <span className="font-display text-sm font-bold text-[var(--ink)]">🧒🧑 Edad</span>
              <p className="text-[11px] text-[var(--ink-3)]">
                El mundo de {k.name}: fija el tema (claro u oscuro) y todos los iconos de tareas, recompensas y medallas.
              </p>
              <div className="mt-2 flex gap-2">
                <form action={setTheme} className="flex-1">
                  <input type="hidden" name="kidId" value={k.id} />
                  <input type="hidden" name="theme" value="infantil" />
                  <button className={themePill(theme === 'infantil')}>🧒 Infantil</button>
                </form>
                <form action={setTheme} className="flex-1">
                  <input type="hidden" name="kidId" value={k.id} />
                  <input type="hidden" name="theme" value="juvenil" />
                  <button className={themePill(theme === 'juvenil')}>🧑 Juvenil</button>
                </form>
              </div>
              <div className="mt-3 border-t-2 border-indigo-50 pt-2">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Así se ven los iconos:</span>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {allIcons.slice(0, 14).map((ic) => (
                    <span key={ic.key} title={ic.label} className="flex aspect-square items-center justify-center">
                      <TaskGlyph iconKey={ic.key} emoji={ic.emoji} style={theme as IconStyle} size={34} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Contar en (+ nombre de los puntos) ── */}
        {sec === 'moneda' && (
          <>
            <div className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <div className="flex gap-2">
                <form action={setUnit} className="flex-1">
                  <input type="hidden" name="kidId" value={k.id} />
                  <input type="hidden" name="unit" value="eur" />
                  <button className={themePill(money.unit === 'eur')}>🪙 Euros</button>
                </form>
                <form action={setUnit} className="flex-1">
                  <input type="hidden" name="kidId" value={k.id} />
                  <input type="hidden" name="unit" value="pts" />
                  <button className={themePill(money.unit === 'pts')}>{money.pointsIcon} Puntos</button>
                </form>
              </div>
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
          </>
        )}

        {/* ── Meta de ahorro ── */}
        {sec === 'meta' && (
          <AutoForm action={setGoal} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <input type="hidden" name="kidId" value={k.id} />
            <p className="text-[11px] text-[var(--ink-3)]">
              Un objetivo al que ahorrar; aparece con barra de progreso en el tablero. Se guarda solo. Déjalo vacío
              para quitarla.
            </p>
            <div className="mt-2 space-y-2">
              {/* Nombre grande + coste a su derecha */}
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Nombre de la meta</span>
                  <input
                    name="goalName"
                    defaultValue={k.goalName ?? ''}
                    placeholder="p. ej. Bici nueva"
                    className="mt-1 w-full rounded-xl border-2 border-indigo-100 px-3 py-2.5 text-base font-display font-bold outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="w-24 shrink-0">
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Coste ({unitWord(money)})</span>
                  <input
                    name="goalCost"
                    defaultValue={k.goalCostCents ? (k.goalCostCents / 100).toString().replace('.', ',') : ''}
                    inputMode="decimal"
                    placeholder="30"
                    className="mt-1 w-full rounded-xl border-2 border-indigo-100 px-2.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </label>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
                <div className="mt-1">
                  <EmojiInput name="goalIcon" defaultValue={k.goalIcon ?? '🎯'} suggestions={GOAL_ICONS} autoSubmit />
                </div>
              </div>
            </div>
          </AutoForm>
        )}

        {/* ── Objetivo familiar (de la cuenta: el mismo para todos los hermanos) ── */}
        {sec === 'familiar' && (
          <AutoForm action={setFamilyGoal} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <div className="space-y-1 text-[11px] text-[var(--ink-3)]">
              <p>Un reto de equipo: N tareas ENTRE TODOS esta semana (lun–dom) = premio compartido.</p>
              <p>Sale en el tablero de todos. Se guarda solo al salir.</p>
              <p>Para quitarlo, vacía los dos campos.</p>
            </div>
            <p className="mt-1 text-[11px] font-bold text-[var(--ink-2)]">
              👨‍👩‍👧‍👦 Es el MISMO objetivo para toda la familia: si lo cambias aquí, cambia para todos los hermanos.
            </p>
            <div className="mt-2 flex items-end gap-2">
              <label className="w-28">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Tareas/semana</span>
                <input
                  name="target"
                  type="number"
                  min={0}
                  defaultValue={acc?.famTarget ?? ''}
                  placeholder="20"
                  className={inputCls}
                />
              </label>
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Premio</span>
                <input
                  name="reward"
                  defaultValue={acc?.famReward ?? ''}
                  placeholder="p. ej. 🎬 Peli con palomitas"
                  className={inputCls}
                />
              </label>
            </div>
          </AutoForm>
        )}

        {/* ── Modo niño ── */}
        {sec === 'modo' && (
          <>
          <div className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <p className="text-[11px] font-semibold text-[var(--ink-3)]">
              Una pantalla sencilla y segura para dejarle el móvil o la tablet a {k.name}: solo ve lo suyo. En modo
              niño puede…
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] font-semibold text-[var(--ink-2)]">
              <li>✅ Apuntar sus tareas — te llegan a «Para aprobar» y las confirmas tú.</li>
              <li>
                🎁 Canjear sus puntos o su dinero por recompensas — el canje también pasa por tu visto bueno, y si lo
                rechazas se le devuelve a la hucha.
              </li>
              <li>🏅 Ver sus logros: racha, medallas y lo que lleva ganado.</li>
              <li>🎯 Seguir su meta de ahorro y el objetivo familiar.</li>
              <li>📅 Repasar su histórico de tareas.</li>
            </ul>
            <p className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
              No puede entrar en los ajustes, ni ver lo de sus hermanos, ni aprobar nada.
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
              Se entra con el botón de abajo (o desde 📱 en la barra de arriba) y el aparato se queda en modo niño
              hasta que se sale: pulsando 👤 arriba a la derecha, con tu contraseña o tu huella. {k.name} no puede
              salir solo.
            </p>
            <form action={enterKid} className="mt-2">
              <input type="hidden" name="kidId" value={k.id} />
              <SubmitButton className="tap-bounce w-full rounded-xl border-2 border-indigo-200 py-2 font-display text-sm font-bold text-indigo-600">
                Entrar en modo niño como {k.name} →
              </SubmitButton>
            </form>
          </div>

          <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <span className="font-display text-sm font-bold text-[var(--ink)]">🔔 Avisos</span>
            <p className="mb-2 mt-0.5 text-[11px] font-semibold text-[var(--ink-3)]">
              Recibe un recordatorio diario y un aviso cuando un hijo apunte una tarea desde el modo niño.
            </p>
            <PushToggle />
          </div>
          </>
        )}
      </div>
    </ThemeShell>
  )
}
