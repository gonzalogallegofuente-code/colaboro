import Link from 'next/link'
import { getActiveKids, getKidStats, getBadgeDefs } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { formatAmount, moneyOf, themeOf } from '@/lib/money'
import { computeBadges } from '@/lib/badges'
import { edadBadgeSrc } from '@/lib/edad-icons'
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
          <Nav kidMode={isKid} />
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
  const badgeDefs = await getBadgeDefs(viewer.accountId)
  const badges = computeBadges(badgeDefs, { bestStreak: stats.bestStreak, total: stats.total, earnedUnits: stats.earnedCents / 100 })

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav kidMode={isKid} />

        {/* Los logros son de CADA hijo: cabecera con su identidad y vuelta a su tablero */}
        <div className="flex items-center gap-2 px-3 pt-1">
          <Link
            href={isKid ? '/' : `/?kid=${selKid.id}`}
            className="tap-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--card)] font-display text-xl font-bold text-[var(--head)] shadow-sm"
            aria-label="Volver a su tablero"
          >
            ←
          </Link>
          <div
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-3xl p-2.5 pl-3 text-white shadow-md"
            style={{ background: selKid.color }}
          >
            <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={40} />
            <div className="truncate font-display text-lg font-bold leading-tight">🏅 Logros de {selKid.name}</div>
          </div>
        </div>

        <p className="px-4 pt-2 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          🔥 <span className="text-[var(--ink-2)]">Racha</span>: días seguidos haciendo alguna tarea (no se
          rompe si hoy aún no ha apuntado nada).
        </p>

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={edadBadgeSrc(theme, b.icon)} alt="" width={40} height={40} style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <span className="text-[11px] font-semibold leading-tight text-[var(--ink-2)]">{b.label}</span>
              {b.rewardCents > 0 && (
                <span className="text-[10px] font-bold text-emerald-600">+{formatAmount(b.rewardCents, money)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ThemeShell>
  )
}
