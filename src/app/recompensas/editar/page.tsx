import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAllRewards, getActiveKids } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { moneyOf, themeOf } from '@/lib/money'
import { addReward, setRewardActive, updateReward } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { AutoForm } from '@/components/AutoForm'
import { RewardGlyph } from '@/components/RewardGlyph'
import { SlugPicker } from '@/components/SlugPicker'
import { edadRewardSrc } from '@/lib/edad-icons'

export const dynamic = 'force-dynamic'

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
  const kids = await getActiveKids(accountId)
  const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

  if (kids.length === 0) {
    return (
      <ThemeShell theme="infantil">
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
      </ThemeShell>
    )
  }

  // Cada pantalla de edición es SOLO del hijo desde cuyos ajustes se abrió.
  const kidParam = sp.kid ? Number(sp.kid) : undefined
  const selKid = kids.find((k) => k.id === kidParam)
  if (!selKid) redirect('/tareas')
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)
  const rewards = await getAllRewards(accountId, selKid.id)
  const activas = rewards.filter((r) => r.active)
  const ocultas = rewards.filter((r) => !r.active)
  const subHead = 'px-2 pt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-3)]'

  return (
    <ThemeShell theme={theme}>
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <div className="flex items-center justify-between px-4 pt-2">
        <h1 className="font-display text-xl font-bold text-[var(--head)]">✏️ Editar recompensas</h1>
        <Link href={`/tareas/${selKid.id}`} className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
          ← Volver
        </Link>
      </div>
      <p className="px-4 pt-1 text-xs font-semibold leading-snug text-[var(--ink-3)]">
        Las recompensas son los premios que {selKid.name} puede conseguir con lo que gana haciendo tareas. Se canjean
        en la pestaña 🎁: el coste se descuenta de su hucha y, si el canje se pide desde el modo niño, te llega a ti
        para darle el visto bueno. Cada hijo tiene su propia lista. Toca el dibujo, el nombre o el coste para
        cambiarlos (se guarda solo); «Desactivar» la aparta sin borrar nada, y podrás reactivarla desde abajo.
      </p>

      {/* Hijo elegido (solo se editan SUS recompensas) — fijo al hacer scroll */}
      <div className="sticky top-14 z-20 bg-[var(--nav)] px-3 py-2 backdrop-blur-md">
        <div
          className="flex items-center justify-center gap-2 rounded-2xl px-2 py-2 text-white shadow-md"
          style={{ background: selKid.color }}
        >
          <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={28} />
          <span className="font-display font-bold">Recompensas de {selKid.name}</span>
        </div>
      </div>

      <div className="mx-3 mt-3 space-y-2.5">
        {/* Recompensas activas: tarjeta editable en 2 líneas */}
        {activas.map((r) => (
          <div key={r.id} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <AutoForm action={updateReward}>
              <input type="hidden" name="id" value={r.id} />
              {/* Línea 1: dibujo (tocable → galería para cambiarlo) + nombre */}
              <SlugPicker
                edad={theme}
                defaultSlug={r.iconSlug}
                fallbackSrc={edadRewardSrc(theme, { iconKey: r.iconKey, name: r.name })}
                autoSubmit
              >
                <input name="name" defaultValue={r.name} className={`${inputCls} min-w-0 flex-1 font-display font-bold`} />
              </SlugPicker>
              {/* Línea 2: importe (sin unidad fija) + Ocultar. Se guarda solo. */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  name="cost"
                  defaultValue={costInput(r.costCents)}
                  inputMode="decimal"
                  placeholder="Coste"
                  aria-label="Coste"
                  className={`${inputCls} flex-1`}
                />
                <button
                  form={`ocultar-r-${r.id}`}
                  className="tap-bounce shrink-0 rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-gray-600"
                >
                  Desactivar
                </button>
              </div>
            </AutoForm>
            <form id={`ocultar-r-${r.id}`} action={setRewardActive}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="active" value="0" />
            </form>
          </div>
        ))}

        {/* Añadir */}
        <form action={addReward} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
          <input type="hidden" name="kidId" value={selKid.id} />
          <SlugPicker edad={theme} defaultSlug={null} fallbackSrc={`/icons/${theme}/regalo.svg`}>
            <input name="name" placeholder={`Nueva recompensa para ${selKid.name}`} className={`${inputCls} min-w-0 flex-1 font-display font-bold`} required />
          </SlugPicker>
          <div className="mt-2 flex items-center gap-2">
            <input name="cost" defaultValue="5" inputMode="decimal" placeholder="Coste" aria-label="Coste" className={`${inputCls} flex-1`} />
            <SubmitButton className="tap-bounce shrink-0 rounded-xl bg-emerald-600 px-4 py-2 font-display text-sm font-bold text-white">
              Añadir
            </SubmitButton>
          </div>
        </form>

        {/* Ocultas: plegadas a una línea, al final */}
        {ocultas.length > 0 && (
          <>
            <p className={subHead}>Desactivadas</p>
            {ocultas.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-3xl bg-[var(--card)] p-2.5 opacity-60 shadow-sm">
                <RewardGlyph iconKey={r.iconKey} iconSlug={r.iconSlug} emoji={r.icon} name={r.name} edad={theme} size={32} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-[var(--ink)]">{r.name}</span>
                <button
                  form={`ocultar-r-${r.id}`}
                  className="tap-bounce shrink-0 rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-gray-600"
                >
                  Activar
                </button>
                <form id={`ocultar-r-${r.id}`} action={setRewardActive}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value="1" />
                </form>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </ThemeShell>
  )
}
