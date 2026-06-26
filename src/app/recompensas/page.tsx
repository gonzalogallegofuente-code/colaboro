import Link from 'next/link'
import { getRewardsData } from '@/lib/data'
import { formatAmount, unitIcon, moneyOf, themeOf } from '@/lib/money'
import { requireViewerPage } from '@/lib/session'
import { redeemReward } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { RewardGlyph } from '@/components/RewardGlyph'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'

export const dynamic = 'force-dynamic'

export default async function RecompensasPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
}) {
  const sp = await searchParams
  const kidParam = sp.kid ? Number(sp.kid) : undefined
  const viewer = await requireViewerPage()
  const isKid = viewer.isKid
  const data = await getRewardsData(viewer.accountId, isKid ? viewer.kidId! : kidParam)

  if (!data) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md">
          <Nav active="recompensas" kidMode={isKid} />
          <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Todavía no hay nadie dado de alta.
          </div>
        </div>
      </ThemeShell>
    )
  }

  const { kids, selectedKidId, rewards, redemptions } = data
  const selKid = kids.find((k) => k.id === selectedKidId)!
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)

  return (
    <ThemeShell theme={theme}>
    <div className="mx-auto max-w-md pb-12">
      <Nav active="recompensas" kidMode={isKid} />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">🎁 Recompensas</h1>
      <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">
        Canjea {money.unit === 'pts' ? money.pointsName : 'euros'} por premios.
      </p>

      {/* Hijo (oculto en modo niño) */}
      {!isKid && (
      <div className="mt-3 grid grid-cols-2 gap-3 px-3">
        {kids.map((k) => {
          const on = k.id === selKid.id
          return (
            <Link
              key={k.id}
              href={`/recompensas?kid=${k.id}`}
              replace
              className={`tap-bounce flex items-center justify-center gap-2 rounded-2xl p-3 shadow-md transition ${
                on ? 'scale-[1.03] shadow-xl ring-4 ring-white' : 'opacity-90'
              }`}
              style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
            >
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={36} />
              <div className="text-left">
                <div className="font-display font-bold leading-tight">{k.name}</div>
                <div className={`text-sm font-bold ${on ? 'text-white/90' : 'text-[var(--chip-ink)]'}`}>
                  {unitIcon(moneyOf(k))} {formatAmount(k.balanceCents, moneyOf(k))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      )}

      <p className="mx-4 mt-3 text-center font-display text-sm font-semibold text-[var(--ink-2)]">
        {selKid.name} tiene{' '}
        <span className="font-bold text-[var(--head)]">{formatAmount(selKid.balanceCents, money)}</span> para gastar
      </p>

      {/* Lista canjeable */}
      <div className="mx-3 mt-2 space-y-2.5">
        {rewards.length === 0 && (
          <div className="rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Aún no hay recompensas.
          </div>
        )}
        {rewards.map((r) => {
          const enough = selKid.balanceCents >= r.costCents
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 shadow-inner">
                <RewardGlyph iconKey={r.iconKey} emoji={r.icon} size={38} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold text-[var(--ink)]">{r.name}</div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs font-bold text-[var(--chip-ink)]">
                  {unitIcon(money)} {formatAmount(r.costCents, money)}
                </span>
                {!enough && (
                  <div className="mt-0.5 text-[11px] font-semibold text-rose-400">
                    Te faltan {formatAmount(r.costCents - selKid.balanceCents, money)}
                  </div>
                )}
              </div>
              <form action={redeemReward}>
                <input type="hidden" name="kidId" value={selKid.id} />
                <input type="hidden" name="rewardId" value={r.id} />
                <ConfirmSubmit
                  message={`¿Canjear «${r.name}» por ${formatAmount(r.costCents, money)}?`}
                  disabled={!enough}
                  className="tap-bounce rounded-2xl bg-emerald-600 px-4 py-2.5 font-display text-sm font-bold text-white shadow-sm disabled:opacity-40"
                >
                  Canjear
                </ConfirmSubmit>
              </form>
            </div>
          )
        })}
      </div>

      {/* Canjes recientes */}
      {redemptions.length > 0 && (
        <>
          <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">🧾 Últimos canjes</h2>
          <div className="mx-3 mt-2 space-y-2">
            {redemptions.map((red) => {
              const kid = kids.find((k) => k.id === red.kidId)
              const d = new Date(red.createdAt)
              return (
                <div key={red.id} className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-3 py-2 shadow-sm">
                  <span className="text-2xl">{red.rewardIcon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[var(--ink)]">{red.rewardName}</div>
                    <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                      {kid?.name} · {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className="font-display text-sm font-bold text-rose-500">
                    −{formatAmount(red.costCents, moneyOf(kid ?? selKid))}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
    </ThemeShell>
  )
}
