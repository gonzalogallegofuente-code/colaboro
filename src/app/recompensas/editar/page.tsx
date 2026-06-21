import Link from 'next/link'
import { getAllRewards } from '@/lib/data'
import { getMoneyConfig } from '@/lib/settings'
import { unitWord } from '@/lib/money'
import { addReward, setRewardActive, updateReward } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'
import { EmojiInput } from '@/components/EmojiInput'

export const dynamic = 'force-dynamic'

const REWARD_ICONS = ['🎮', '🍦', '🍫', '🌙', '🎬', '🛝', '📱', '🧸', '💶', '🍕', '🎨', '⚽', '🎟️', '🚲', '📚', '🎤']

function costInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function EditarRecompensasPage() {
  const [rewards, money] = await Promise.all([getAllRewards(), getMoneyConfig()])
  const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="recompensas" />

      <div className="flex items-center justify-between px-4 pt-2">
        <h1 className="font-display text-xl font-bold text-indigo-800">✏️ Editar recompensas</h1>
        <Link
          href="/recompensas"
          className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm"
        >
          ← Volver
        </Link>
      </div>
      <p className="px-4 text-xs font-semibold text-indigo-900/50">
        Pon el icono, el nombre y el coste de cada premio. «Ocultar» lo quita sin borrar los canjes.
      </p>

      <div className="mx-3 mt-3 space-y-2.5">
        {rewards.map((r) => (
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
