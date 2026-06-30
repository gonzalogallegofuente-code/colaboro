import Link from 'next/link'
import { getActiveKids, getKidStats } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { formatAmount, moneyOf, themeOf } from '@/lib/money'
import { computeBadges } from '@/lib/badges'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'

export const dynamic = 'force-dynamic'

export default async function LogrosPage({ searchParams }: { searchParams: Promise<{ kid?: string }> }) {
  const sp = await searchParams
  const viewer = await requireViewerPage()
  const isKid = viewer.isKid
  const kids = await getActiveKids(viewer.accountId)

  if (kids.length === 0) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md">
          <Nav active="logros" kidMode={isKid} />
          <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Todavía no hay nadie dado de alta.
          </div>
        </div>
      </ThemeShell>
    )
  }

  const kidParam = isKid ? viewer.kidId! : sp.kid ? Number(sp.kid) : undefined
  const selKid = kids.find((k) => k.id === kidParam) ?? kids[0]
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)
  const stats = await getKidStats(selKid.id)
  const badges = computeBadges({ bestStreak: stats.bestStreak, total: stats.total, earnedUnits: stats.earnedCents / 100 })

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav active="logros" kidMode={isKid} />

        <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">🏅 Logros</h1>
        <p className="px-4 pt-1 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          🔥 <span className="text-[var(--ink-2)]">Racha</span>: días seguidos haciendo alguna tarea (no se
          rompe si hoy aún no ha apuntado nada).
        </p>

        {/* Hijo (oculto en modo niño) */}
        {!isKid && (
        <div className="mt-3 flex gap-2 px-3">
          {kids.map((k) => {
            const on = k.id === selKid.id
            return (
              <Link
                key={k.id}
                href={`/logros?kid=${k.id}`}
                replace
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-2 shadow-sm ${on ? 'shadow-md ring-2 ring-white' : ''}`}
                style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
              >
                <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={28} />
                <span className="font-display font-bold">{k.name}</span>
              </Link>
            )
          })}
        </div>
        )}

        {/* Resumen */}
        <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[var(--card)] p-3 text-center shadow-md">
            <div className="text-2xl">🔥</div>
            <div className="font-display text-lg font-bold text-[var(--ink)]">{stats.currentStreak}</div>
            <div className="text-[10px] font-semibold text-[var(--ink-3)]">racha (días)</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-3 text-center shadow-md">
            <div className="text-2xl">✅</div>
            <div className="font-display text-lg font-bold text-[var(--ink)]">{stats.total}</div>
            <div className="text-[10px] font-semibold text-[var(--ink-3)]">tareas hechas</div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-3 text-center shadow-md">
            <div className="text-2xl">💰</div>
            <div className="font-display text-sm font-bold text-[var(--ink)]">{formatAmount(stats.earnedCents, money)}</div>
            <div className="text-[10px] font-semibold text-[var(--ink-3)]">ganado total</div>
          </div>
        </div>

        {/* Medallas */}
        <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">Medallas</h2>
        <p className="px-4 pt-0.5 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          Se ganan por hitos (tareas hechas, mejor racha o dinero ganado) y no se pierden. Las grises aún no están conseguidas.
        </p>
        <div className="mx-3 mt-2 grid grid-cols-3 gap-2.5">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center shadow-md ${
                b.earned ? 'bg-[var(--card)]' : 'bg-[var(--card)] opacity-40 grayscale'
              }`}
            >
              <span className="text-3xl">{b.icon}</span>
              <span className="text-[11px] font-semibold leading-tight text-[var(--ink-2)]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </ThemeShell>
  )
}
