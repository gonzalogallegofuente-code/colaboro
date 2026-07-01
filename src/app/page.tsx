import Link from 'next/link'
import { getBoardData, getKidStats } from '@/lib/data'
import { computeBadges } from '@/lib/badges'
import { requireViewerPage } from '@/lib/session'
import { todayYmd } from '@/lib/week'
import { formatAmount, unitIcon, moneyOf, themeOf } from '@/lib/money'
import { markTask, undoTask } from './actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { InstallPrompt } from '@/components/InstallPrompt'
import { Avatar } from '@/components/Avatar'
import { TaskGlyph } from '@/components/TaskGlyph'
import { iconColor, type IconStyle } from '@/lib/icons'
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
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

  const selKid = data.kids.find((k) => k.id === data.selectedKidId)!
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)

  const stats = await getKidStats(selKid.id)
  const badges = computeBadges({ bestStreak: stats.bestStreak, total: stats.total, earnedUnits: stats.earnedCents / 100 })
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
          <Link href="/salir" className="font-bold text-red-500">🚪 Salir</Link>
        </div>
      )}

      {/* Selector de hijo (oculto en modo niño) */}
      {!isKid && (
      <div className="grid grid-cols-2 gap-3 px-3">
        {data.kids.map((k) => {
          const on = k.id === selKid.id
          return (
            <Link
              key={k.id}
              href={`/?kid=${k.id}`}
              replace
              className={`tap-bounce relative overflow-hidden rounded-3xl p-3 text-center shadow-md transition ${
                on ? 'scale-[1.03] shadow-xl ring-4 ring-white' : 'opacity-90'
              }`}
              style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
            >
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={56} className="mx-auto" />
              <div className="mt-1 font-display text-lg font-bold">{k.name}</div>
              <div
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-lg font-extrabold ${
                  on ? 'bg-white/25 text-white' : 'bg-[var(--chip)] text-[var(--chip-ink)]'
                }`}
              >
                {unitIcon(moneyOf(k))} {formatAmount(k.weekCents, moneyOf(k))}
              </div>
            </Link>
          )
        })}
      </div>
      )}

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
            {goalDone ? '¡Meta conseguida! 🎉' : `Te faltan ${formatAmount(goalCost - goalBal, money)}`}
          </div>
        </div>
        </>
      )}

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
              <span key={b.id} className="text-xl">
                {b.icon}
              </span>
            ))
          )}
        </div>
        <span className="shrink-0 text-xs font-bold text-[var(--ink-3)]">
          {earnedBadges.length}/{badges.length} ›
        </span>
      </Link>

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
        {data.tasks.map((t) => {
          const week = data.weekCountByTask[t.id] ?? 0
          const day = data.dayCountByTask[t.id] ?? 0
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md animate-pop">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner"
                style={{ background: t.color }}
              >
                <TaskGlyph iconKey={t.iconKey} emoji={t.icon} style={selKid.iconStyle as IconStyle} size={34} color={iconColor(t.color)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold text-[var(--ink)]">{t.name}</div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs font-bold text-[var(--chip-ink)]">
                  {unitIcon(money)} {formatAmount(t.valueCents, money)}
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
        })}
      </div>
    </div>
    </ThemeShell>
  )
}
