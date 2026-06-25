import Link from 'next/link'
import { getAllRewards, getActiveKids } from '@/lib/data'
import { getMoneyConfig } from '@/lib/settings'
import { requireAccountPage } from '@/lib/session'
import { unitWord } from '@/lib/money'
import { addReward, setRewardActive, updateReward } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { EmojiInput } from '@/components/EmojiInput'

export const dynamic = 'force-dynamic'

const REWARD_ICONS = ['🎮', '🍦', '🍫', '🌙', '🎬', '🛝', '📱', '🧸', '💶', '🍕', '🎨', '⚽', '🎟️', '🚲', '📚', '🎤']

function costInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function EditarRecompensasPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
}) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const [kids, money] = await Promise.all([getActiveKids(accountId), getMoneyConfig(accountId)])
  const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

  if (kids.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <Nav active="tareas" />
        <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
          Primero añade un hijo en{' '}
          <Link href="/tareas" className="font-bold text-indigo-600 underline">
            Ajustes
          </Link>
          .
        </div>
      </div>
    )
  }

  const kidParam = sp.kid ? Number(sp.kid) : undefined
  const selKid = kids.find((k) => k.id === kidParam) ?? kids[0]
  const rewards = await getAllRewards(accountId, selKid.id)

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <div className="flex items-center justify-between px-4 pt-2">
        <h1 className="font-display text-xl font-bold text-[var(--head)]">✏️ Editar recompensas</h1>
        <Link href="/tareas" className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
          ← Ajustes
        </Link>
      </div>

      {/* Hijo */}
      <div className="mt-3 flex gap-2 px-3">
        {kids.map((k) => {
          const on = k.id === selKid.id
          return (
            <Link
              key={k.id}
              href={`/recompensas/editar?kid=${k.id}`}
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

      <div className="mx-3 mt-3 space-y-2.5">
        {rewards.map((r) => (
          <div key={r.id} className={`rounded-3xl bg-[var(--card)] p-3 shadow-md ${r.active ? '' : 'opacity-60'}`}>
            <form action={updateReward}>
              <input type="hidden" name="id" value={r.id} />
              <div className="flex items-center gap-2">
                <span className="text-2xl">{r.icon}</span>
                <input name="name" defaultValue={r.name} className={`${inputCls} flex-1 font-display font-bold`} />
              </div>
              <label className="mt-2 block">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Coste ({unitWord(money)})</span>
                <input name="cost" defaultValue={costInput(r.costCents)} inputMode="decimal" className={inputCls} />
              </label>
              <div className="mt-2">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
                <EmojiInput name="icon" defaultValue={r.icon} suggestions={REWARD_ICONS} />
              </div>
              <SubmitButton className="tap-bounce mt-2.5 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                Guardar
              </SubmitButton>
            </form>
            <ToggleRewardActive id={r.id} active={r.active} />
          </div>
        ))}

        {/* Añadir */}
        <form action={addReward} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
          <input type="hidden" name="kidId" value={selKid.id} />
          <input name="name" placeholder={`Nueva recompensa para ${selKid.name}`} className={`${inputCls} font-display font-bold`} required />
          <label className="mt-2 block">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Coste ({unitWord(money)})</span>
            <input name="cost" defaultValue="5" inputMode="decimal" className={inputCls} />
          </label>
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
            <EmojiInput name="icon" defaultValue="🎁" suggestions={REWARD_ICONS} />
          </div>
          <SubmitButton className="tap-bounce mt-2.5 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
            Añadir recompensa
          </SubmitButton>
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
      <SubmitButton className="text-xs font-semibold text-[var(--ink-3)] underline underline-offset-2">
        {active ? 'Ocultar' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
