import { REWARD_CATALOG } from '@/lib/reward-icons'
import { ICON_REWARDS } from '@/lib/icon-rewards'

// Define los <symbol> de los iconos de recompensa UNA vez; el selector los
// reutiliza con <use href="#ric-KEY"> sin repetir los datos.
export function RewardIconDefs() {
  const keys = REWARD_CATALOG.flatMap((c) => c.icons.map((i) => i.key)).filter((k) => ICON_REWARDS[k])
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {keys.map((k) => (
          <symbol key={k} id={`ric-${k}`} viewBox="0 0 100 100">
            <image href={ICON_REWARDS[k]} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
          </symbol>
        ))}
      </defs>
    </svg>
  )
}
