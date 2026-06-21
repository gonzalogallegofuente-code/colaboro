import Link from 'next/link'
import { getRewardsData, getAllRewards } from '@/lib/data'
import { formatAmount, unitIcon, unitWord } from '@/lib/money'
import { addReward, redeemReward, setRewardActive, updateReward } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { EmojiInput } from '@/components/EmojiInput'

export const dynamic = 'force-dynamic'

const REWARD_ICONS = ['🎮', '🍦', '🍫', '🌙', '🎬', '🛝', '📱', '🧸', '💶', '🍕', '🎨', '⚽', '🎟️', '🚲', '📚', '🎤']

function costInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function RecompensasPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
}) {
  const sp = await searchParams
  const kidParam = sp.kid ? Number(sp.kid) : undefined
  const [data, allRewards] = await Promise.all([getRewardsData(kidParam), getAllRewards()])

  if (!data) {
    return (
      <div className="mx-auto max-w-md">
        <Nav active="recompensas" />
        <div className="mx-3 mt-10 rounded-3xl bg-white/90 p-6 text-center text-gray-600 shadow-md">
          Todavía no hay nadie dado de alta.
        </div>
      </div>
    )
  }

  const { money, kids, selectedKidId, rewards, redemptions } = data
  const selKid = kids.find((k) => k.id === selectedKidId)!
  const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="recompensas" />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-indigo-800">🎁 Recompensas</h1>
      <p className="px-4 text-xs font-semibold text-indigo-900/50">
        Canjea {money.unit === 'pts' ? money.pointsName : 'euros'} por premios. La lista la rellenáis vosotros.
      </p>

      {/* Hijo */}
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
              style={{ background: on ? k.color : 'rgba(255,255,255,0.85)', color: on ? '#fff' : '#374151' }}
            >
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={36} />
              <div className="text-left">
                <div className="font-display font-bold leading-tight">{k.name}</div>
                <div className={`text-sm font-bold ${on ? 'text-white/90' : 'text-amber-700'}`}>
                  {unitIcon(money)} {formatAmount(k.balanceCents, money)}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="mx-4 mt-3 text-center font-display text-sm font-semibold text-indigo-900/70">
        {selKid.name} tiene <span className="font-bold text-indigo-700">{formatAmount(selKid.balanceCents, money)}</span> para gastar
      </p>

      {/* Lista canjeable */}
      <div className="mx-3 mt-2 space-y-2.5">
        {rewards.length === 0 && (
          <div className="rounded-3xl bg-white/90 p-6 text-center text-gray-500 shadow-md">
            No hay recompensas. Añade alguna abajo 👇
          </div>
        )}
        {rewards.map((r) => {
          const enough = selKid.balanceCents >= r.costCents
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-3xl bg-white/90 p-3 shadow-md">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl shadow-inner">
                {r.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold text-gray-800">{r.name}</div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
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
          <h2 className="px-4 pt-6 font-display text-lg font-bold text-indigo-800">🧾 Últimos canjes</h2>
          <div className="mx-3 mt-2 space-y-2">
            {redemptions.map((red) => {
              const kid = kids.find((k) => k.id === red.kidId)
              const d = new Date(red.createdAt)
              return (
                <div key={red.id} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
                  <span className="text-2xl">{red.rewardIcon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-gray-700">{red.rewardName}</div>
                    <div className="text-[11px] font-semibold text-gray-400">
                      {kid?.name} · {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className="font-display text-sm font-bold text-rose-500">
                    −{formatAmount(red.costCents, money)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Gestionar */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-indigo-800">✏️ Editar recompensas</h2>
      <div className="mx-3 mt-2 space-y-2.5">
        {allRewards.map((r) => (
          <div key={r.id} className={`rounded-3xl bg-white/90 p-3 shadow-md ${r.active ? '' : 'opacity-60'}`}>
            <form action={updateReward}>
              <input type="hidden" name="id" value={r.id} />
              <div className="flex items-start gap-3">
                <EmojiInput name="icon" defaultValue={r.icon} suggestions={REWARD_ICONS} />
                <div className="flex-1 space-y-2">
                  <input name="name" defaultValue={r.name} className={`${inputCls} font-display font-bold`} />
                  <label className="block">
                    <span className="text-[11px] font-semibold text-gray-400">Coste ({unitWord(money)})</span>
                    <input name="cost" defaultValue={costInput(r.costCents)} inputMode="decimal" className={inputCls} />
                  </label>
                  <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                    Guardar
                  </SubmitButton>
                </div>
              </div>
            </form>
            <ToggleRewardActive id={r.id} active={r.active} />
          </div>
        ))}

        {/* Añadir */}
        <form action={addReward} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white/70 p-3">
          <div className="flex items-start gap-3">
            <EmojiInput name="icon" defaultValue="🎁" suggestions={REWARD_ICONS} />
            <div className="flex-1 space-y-2">
              <input name="name" placeholder="Nueva recompensa" className={`${inputCls} font-display font-bold`} required />
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-400">Coste ({unitWord(money)})</span>
                <input name="cost" defaultValue="5" inputMode="decimal" className={inputCls} />
              </label>
              <SubmitButton className="tap-bounce w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
                Añadir recompensa
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function ToggleRewardActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form action={setRewardActive} className="mt-2 text-right">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? '0' : '1'} />
      <SubmitButton className="text-xs font-semibold text-gray-400 underline underline-offset-2">
        {active ? 'Ocultar' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
