import Link from 'next/link'
import {
  getBoardData,
  getKidStats,
  getBadgeDefs,
  getPendingCompletions,
  getFamilyGoal,
  type PendingCompletion,
  type FamilyGoal,
} from '@/lib/data'
import { computeBadges } from '@/lib/badges'
import { requireViewerPage } from '@/lib/session'
import { todayYmd, friendlyDay } from '@/lib/week'
import { formatAmount, unitIcon, moneyOf, themeOf } from '@/lib/money'
import { markTask, undoTask, approveCompletion, rejectCompletion } from './actions'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { InstallPrompt } from '@/components/InstallPrompt'
import { Avatar } from '@/components/Avatar'
import { TaskGlyph } from '@/components/TaskGlyph'
import { iconColor, type IconStyle } from '@/lib/icons'
import { edadBadgeSrc } from '@/lib/edad-icons'
import { SubmitButton } from '@/components/SubmitButton'
import { CoinButton } from '@/components/CoinButton'

export const dynamic = 'force-dynamic'

function ProgressCoins({ count, target }: { count: number; target: number }) {
  const filled = Math.min(count, target)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border ${
            i < filled
              ? 'border-amber-500 bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm'
              : 'border-gray-200 bg-gray-100'
          }`}
        />
      ))}
      <span className="ml-1 font-display text-xs font-semibold text-[var(--ink-2)]">
        {count}/{target}
        {count > target ? ` +${count - target}` : ''}
      </span>
    </div>
  )
}

// Marcas de los niños pendientes del visto bueno del padre (✓ aprueba, ✕ rechaza).
function PendientesSection({ pendientes }: { pendientes: PendingCompletion[] }) {
  if (pendientes.length === 0) return null
  return (
    <>
      <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">⏳ Para aprobar</h2>
      <div className="mx-3 space-y-1.5">
        {pendientes.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 rounded-2xl bg-[var(--card)] px-3 py-2 shadow-sm">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl shadow-inner"
              style={{ background: p.taskColor }}
            >
              {p.taskIcon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-bold text-[var(--ink)]">{p.taskName}</div>
              <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                {p.kidName} · {friendlyDay(p.doneOn)} ·{' '}
                {formatAmount(p.valueCents, moneyOf({ unit: p.kidUnit, pointsName: p.kidPointsName, pointsIcon: p.kidPointsIcon }))}
              </div>
            </div>
            <form action={approveCompletion}>
              <input type="hidden" name="id" value={p.id} />
              <SubmitButton
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-base leading-none text-white shadow-sm"
                aria-label={`Aprobar ${p.taskName} de ${p.kidName}`}
              >
                ✓
              </SubmitButton>
            </form>
            <form action={rejectCompletion}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmSubmit
                message={`¿Rechazar «${p.taskName}» de ${p.kidName}? Se quitará como si no se hubiera marcado.`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-base leading-none text-red-500"
              >
                ✕
              </ConfirmSubmit>
            </form>
          </div>
        ))}
      </div>
    </>
  )
}

// Objetivo familiar semanal (entre todos los hermanos), con barra de progreso.
function FamGoalSection({ goal }: { goal: FamilyGoal }) {
  const pct = Math.min(100, Math.round((goal.count / goal.target) * 100))
  return (
    <>
      <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">👨‍👩‍👧‍👦 Objetivo familiar</h2>
      <div className="mx-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <div className="flex items-center justify-between gap-2 text-sm font-bold text-[var(--ink)]">
          <span className="truncate">
            {goal.done ? '¡Conseguido! 🎉' : `${goal.count} de ${goal.target} tareas entre todos`}
          </span>
          <span className="shrink-0 text-[var(--ink-2)]">→ {goal.reward}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] font-semibold text-[var(--ink-3)]">
          {goal.done
            ? `Habéis hecho ${goal.count} tareas esta semana. ¡A disfrutar el premio!`
            : 'Esta semana, sumando las tareas de todos los hermanos.'}
        </div>
      </div>
    </>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string; extras?: string }>
}) {
  const sp = await searchParams
  const today = todayYmd()
  const kidParam = sp.kid ? Number(sp.kid) : undefined

  const viewer = await requireViewerPage()
  const accountId = viewer.accountId
  const isKid = viewer.isKid
  const data = await getBoardData(accountId, today, isKid ? viewer.kidId! : kidParam)

  if (!data) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md">
          <Nav active="inicio" />
          <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center shadow-md">
            <p className="text-[var(--ink-2)]">Todavía no hay nadie dado de alta.</p>
            <Link href="/tareas" className="mt-3 inline-block rounded-2xl bg-indigo-600 px-4 py-2 font-display font-bold text-white">
              Añadir hijos y tareas
            </Link>
          </div>
        </div>
      </ThemeShell>
    )
  }

  // Con más de un hijo, la portada del padre es ELEGIR hijo; lo familiar
  // (pendientes de aprobar, objetivo) vive ahí. Con uno solo, directo a él.
  const multi = !isKid && data.kids.length > 1
  const chooserMode = multi && !kidParam
  const pendientes = isKid ? [] : await getPendingCompletions(accountId)
  const famGoal = await getFamilyGoal(accountId)

  if (chooserMode) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md pb-12">
          <Nav active="inicio" />
          <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">📋 ¿A quién le apuntamos?</h1>
          <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">Toca un hijo para ver y apuntar sus cosas.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 px-3">
            {data.kids.map((k) => {
              const m = moneyOf(k)
              return (
                <Link
                  key={k.id}
                  href={`/?kid=${k.id}`}
                  className="tap-bounce rounded-3xl p-4 text-center text-white shadow-md"
                  style={{ background: k.color }}
                >
                  <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={64} className="mx-auto" />
                  <div className="mt-1.5 font-display text-lg font-bold">{k.name}</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-sm font-extrabold">
                    {unitIcon(m)} {formatAmount(k.weekCents, m)}
                  </div>
                  <div className="mt-1 text-[11px] font-bold text-white/85">Hucha: {formatAmount(k.balanceCents, m)}</div>
                </Link>
              )
            })}
          </div>
          <PendientesSection pendientes={pendientes} />
          {famGoal && <FamGoalSection goal={famGoal} />}
        </div>
      </ThemeShell>
    )
  }

  const selKid = data.kids.find((k) => k.id === data.selectedKidId)!
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)

  const stats = await getKidStats(selKid.id)
  // Valor medio de sus tareas con pago, para "¡con N tareas más lo tienes!".
  const paidTasks = data.tasks.filter((t) => t.valueCents > 0)
  const avgTaskCents = paidTasks.length ? paidTasks.reduce((a, t) => a + t.valueCents, 0) / paidTasks.length : 0
  // Objetivo semanal (solo si el hijo está en modo 'objetivo'): las tareas
  // elegidas (🗓️) con sus veces/semana. Cada tarea aporta como máximo su objetivo.
  const modoObjetivo = selKid.weekMode === 'objetivo'
  const planTasks = data.tasks.filter((t) => t.inPlan)
  const planTotal = modoObjetivo ? planTasks.reduce((a, t) => a + t.weeklyTarget, 0) : 0
  const planDone = planTasks.reduce((a, t) => a + Math.min(data.weekCountByTask[t.id] ?? 0, t.weeklyTarget), 0)
  const planPct = planTotal > 0 ? Math.min(100, Math.round((planDone / planTotal) * 100)) : 0
  const planFullCents = planTasks.reduce((a, t) => a + t.valueCents * t.weeklyTarget, 0)
  // Con objetivo activo, abajo solo salen las tareas acordadas; el resto son extras.
  const conObjetivo = modoObjetivo && planTotal > 0
  const listaTareas = conObjetivo ? planTasks : data.tasks
  const extrasTasks = conObjetivo ? data.tasks.filter((t) => !t.inPlan) : []
  const showExtras = sp.extras === '1'

  // Tarjeta de una tarea (lista principal y extras).
  const tarjetaDeTarea = (t: (typeof data.tasks)[number]) => {
    const week = data.weekCountByTask[t.id] ?? 0
    const day = data.dayCountByTask[t.id] ?? 0
    return (
      <div key={t.id} className="flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md animate-pop">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner"
          style={{ background: t.color }}
        >
          <TaskGlyph iconKey={t.iconKey} emoji={t.icon} name={t.name} style={theme as IconStyle} size={34} color={iconColor(t.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-bold text-[var(--ink)]">{t.name}</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs font-bold text-[var(--chip-ink)]">
            {t.valueCents === 0 ? '🤝 Convivencia' : `${unitIcon(money)} ${formatAmount(t.valueCents, money)}`}
          </span>
          <ProgressCoins count={week} target={t.weeklyTarget} />
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <form action={markTask}>
            <input type="hidden" name="kidId" value={selKid.id} />
            <input type="hidden" name="taskId" value={t.id} />
            <input type="hidden" name="doneOn" value={today} />
            <CoinButton color={selKid.color} label={`Marcar ${t.name} para ${selKid.name}`} />
          </form>
          {day > 0 && (
            <form action={undoTask} className="flex items-center gap-1">
              <input type="hidden" name="kidId" value={selKid.id} />
              <input type="hidden" name="taskId" value={t.id} />
              <input type="hidden" name="doneOn" value={today} />
              <SubmitButton
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg leading-none text-[var(--ink-2)]"
                aria-label="Quitar una"
              >
                −
              </SubmitButton>
              <span className="font-display text-xs font-bold text-[var(--ink-3)]">×{day}</span>
            </form>
          )}
        </div>
      </div>
    )
  }
  const badgeDefs = await getBadgeDefs(accountId)
  const badges = computeBadges(badgeDefs, { bestStreak: stats.bestStreak, total: stats.total, earnedUnits: stats.earnedCents / 100 })
  const earnedBadges = badges.filter((b) => b.earned)

  const goalCost = selKid.goalCostCents ?? 0
  const hasGoal = goalCost > 0
  const goalBal = Math.max(0, selKid.balanceCents)
  const goalPct = hasGoal ? Math.min(100, Math.round((goalBal / goalCost) * 100)) : 0
  const goalDone = goalBal >= goalCost

  return (
    <ThemeShell theme={theme}>
    <div className="mx-auto max-w-md pb-12">
      <Nav active="inicio" kidMode={isKid} />
      <InstallPrompt />

      {isKid && (
        <div className="mx-3 mb-1 flex items-center justify-between rounded-2xl bg-[var(--card)] px-3 py-1.5 text-xs shadow-sm">
          <span className="font-bold text-[var(--ink-3)]">👦 Modo niño</span>
          <Link href="/salir" className="font-bold text-indigo-600">👤 Modo adulto</Link>
        </div>
      )}

      {/* Saludo del niño (portada del modo niño) */}
      {isKid && (
        <div className="mx-3 mt-2 flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={52} />
          <div className="min-w-0">
            <div className="font-display text-xl font-bold text-[var(--head)]">¡Hola, {selKid.name}! 👋</div>
            <div className="text-sm font-semibold text-[var(--ink-2)]">
              Tienes <span className="font-bold text-[var(--ink)]">{formatAmount(selKid.balanceCents, money)}</span> en la hucha
            </div>
          </div>
        </div>
      )}

      {/* Cabecera del hijo elegido (vista de padre) */}
      {!isKid && (
        <div className="flex items-center gap-2 px-3">
          {multi && (
            <Link
              href="/"
              className="tap-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--card)] font-display text-xl font-bold text-[var(--head)] shadow-sm"
              aria-label="Elegir otro hijo"
            >
              ←
            </Link>
          )}
          <div
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-3xl p-2.5 pl-3 text-white shadow-md"
            style={{ background: selKid.color }}
          >
            <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-bold leading-tight">{selKid.name}</div>
              <div className="text-xs font-bold text-white/85">
                Semana {formatAmount(selKid.weekCents, money)} · Hucha {formatAmount(selKid.balanceCents, money)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Para aprobar: con varios hijos vive en la portada de selección */}
      {!multi && <PendientesSection pendientes={pendientes} />}

      {/* Meta de ahorro */}
      {hasGoal && (
        <>
        <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">🎯 Meta de ahorro</h2>
        <div className="mx-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <div className="flex items-center justify-between text-sm font-bold text-[var(--ink)]">
            <span className="truncate">
              {selKid.goalIcon} {selKid.goalName}
            </span>
            <span className="shrink-0">
              {formatAmount(goalBal, money)} / {formatAmount(goalCost, money)}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[var(--ink-3)]">
            {goalDone
              ? '¡Meta conseguida! 🎉'
              : `Te faltan ${formatAmount(goalCost - goalBal, money)}${
                  isKid && avgTaskCents > 0
                    ? ` · ¡con ${Math.max(1, Math.ceil((goalCost - goalBal) / avgTaskCents))} tareas más lo tienes! 💪`
                    : ''
                }`}
          </div>
        </div>
        </>
      )}

      {/* Objetivo familiar: el padre con varios hijos lo ve en la portada */}
      {(isKid || !multi) && famGoal && <FamGoalSection goal={famGoal} />}

      {/* Logros */}
      <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">🏅 Logros</h2>
      <Link
        href={`/logros?kid=${selKid.id}`}
        className="tap-bounce mx-3 flex items-center gap-2 rounded-3xl bg-[var(--card)] p-3 shadow-md"
      >
        {stats.currentStreak > 0 && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-1 text-sm font-bold text-orange-600">
            🔥 {stats.currentStreak} {stats.currentStreak === 1 ? 'día' : 'días'}
          </span>
        )}
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {earnedBadges.length === 0 ? (
            <span className="text-xs font-semibold text-[var(--ink-3)]">Aún sin medallas — ¡a por la primera! 🌱</span>
          ) : (
            earnedBadges.slice(0, 8).map((b) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b.id} src={edadBadgeSrc(theme, b.icon)} alt={b.label} width={22} height={22} style={{ width: 22, height: 22, objectFit: 'contain' }} />
            ))
          )}
        </div>
        <span className="shrink-0 text-xs font-bold text-[var(--ink-3)]">
          {earnedBadges.length}/{badges.length} ›
        </span>
      </Link>

      {/* Objetivo semanal (solo en modo objetivo): progreso de ESTA semana */}
      {planTotal > 0 ? (
        <>
        <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">🗓️ Objetivo semanal</h2>
        <div className="mx-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <div className="flex items-center justify-between gap-2 text-sm font-bold text-[var(--ink)]">
            <span>
              {planDone} de {planTotal} tareas del objetivo
            </span>
            <span className="shrink-0 text-[var(--ink-2)]">{planPct}%</span>
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all"
              style={{ width: `${planPct}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
            {planPct >= 100
              ? '¡Objetivo completado! 🎉 Ahora cada tarea del objetivo que hagas de más vale DOBLE ✨'
              : planPct >= 50
                ? '¡Ya llevas más de la mitad! 💪'
                : isKid
                  ? 'Cada tarea que marques rellena la barra 🙂'
                  : 'Se ajusta en Editar tareas (🗓️ y veces/semana).'}
            {planFullCents > 0 && planPct < 100 && <> Objetivo completo: {formatAmount(planFullCents, money)}.</>}
          </div>
        </div>
        </>
      ) : (
        modoObjetivo &&
        !isKid && (
          <>
          <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">🗓️ Objetivo semanal</h2>
          <Link
            href={`/tareas/editar?kid=${selKid.id}`}
            className="tap-bounce mx-3 flex items-center gap-3 rounded-3xl border-2 border-dashed border-emerald-300 bg-[var(--card)] p-3 shadow-sm"
          >
            <span className="text-2xl">🗓️</span>
            <span className="flex-1 text-[12.5px] font-semibold text-[var(--ink-2)]">
              Montad juntos el objetivo de {selKid.name}: elige qué tareas cuentan (🗓️) y cuántas veces por semana.
              Empieza realista — ¡la barra tiene que poder llenarse! 😉
            </span>
            <span className="font-display text-lg font-bold text-[var(--ink-3)]">›</span>
          </Link>
          </>
        )
      )}

      {/* Tareas */}
      <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">📋 Tareas</h2>
      <div className="mx-3 space-y-2.5">
        {data.tasks.length === 0 && (
          <div className="rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            No hay tareas todavía.{' '}
            <Link href="/tareas" className="font-bold text-indigo-600 underline">
              ¡Añade una!
            </Link>
          </div>
        )}
        {listaTareas.map(tarjetaDeTarea)}
      </div>

      {/* Extras: tareas fuera del objetivo (solo en modo objetivo) */}
      {extrasTasks.length > 0 &&
        (showExtras ? (
          <>
            <h2 className="px-4 pt-4 pb-1 font-display text-base font-bold text-[var(--head)]">➕ Extras</h2>
            <p className="px-4 pb-1 text-[11px] font-semibold text-[var(--ink-3)]">
              No cuentan para el objetivo, pero sí dan {money.unit === 'pts' ? money.pointsName : 'dinero'}, rachas y
              logros.
            </p>
            <div className="mx-3 space-y-2.5">{extrasTasks.map(tarjetaDeTarea)}</div>
            <Link
              href={isKid ? '/' : `/?kid=${selKid.id}`}
              scroll={false}
              replace
              className="tap-bounce mx-auto mt-3 block w-max rounded-full bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--ink-3)] shadow-sm"
            >
              Ocultar extras ▲
            </Link>
          </>
        ) : (
          <Link
            href={isKid ? '/?extras=1' : `/?kid=${selKid.id}&extras=1`}
            scroll={false}
            replace
            className="tap-bounce mx-auto mt-3 block w-max rounded-full bg-[var(--card)] px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm"
          >
            ➕ Extras ({extrasTasks.length}) ▼
          </Link>
        ))}
    </div>
    </ThemeShell>
  )
}
