import Link from 'next/link'
import { getBadgeDefs, seedBadgesIfEmpty } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { addBadge, updateBadge, deleteBadge } from '@/app/actions'
import { METRIC_LABEL, type BadgeMetric } from '@/lib/badges'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { EmojiInput } from '@/components/EmojiInput'

export const dynamic = 'force-dynamic'

const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'
const METRICS: BadgeMetric[] = ['tasks', 'streak', 'earned']
const BADGE_ICONS = ['🏅', '🥇', '🌟', '🔥', '💪', '🚀', '👑', '💎', '🦸', '⚡', '🌱', '🤑', '🏆', '🎯']

export default async function EditarLogrosPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
}) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const kid = sp.kid && /^\d+$/.test(sp.kid) ? Number(sp.kid) : null
  await seedBadgesIfEmpty(accountId)
  const list = await getBadgeDefs(accountId)

  return (
    <ThemeShell theme="infantil">
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <div className="flex items-center justify-between px-4 pt-2">
          <h1 className="font-display text-xl font-bold text-[var(--head)]">🏅 Editar logros</h1>
          <Link
            href={kid ? `/tareas/${kid}` : '/tareas'}
            className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm"
          >
            {kid ? '← Volver' : '← Ajustes'}
          </Link>
        </div>
        <p className="px-4 pt-1 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          Los logros son medallas que los niños ganan al llegar a una meta. Puedes cambiar la meta (el valor), el icono
          y el nombre, o añadir y quitar logros. Cada uno se gana según un dato: <b>tareas hechas</b>,{' '}
          <b>mejor racha (días)</b> o <b>dinero/puntos ganados</b>. Son los mismos para todos los hijos.
        </p>

        <div className="mx-3 mt-3 space-y-2.5">
          {list.map((b) => (
            <div key={b.id} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <form action={updateBadge}>
                <input type="hidden" name="id" value={b.id} />
                {kid && <input type="hidden" name="kid" value={kid} />}
                <div className="flex items-center gap-2">
                  <EmojiInput name="icon" defaultValue={b.icon} suggestions={BADGE_ICONS} />
                  <input name="label" defaultValue={b.label} className={`${inputCls} flex-1 font-display font-bold`} placeholder="Nombre del logro" />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <label className="flex-1">
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">Se gana por</span>
                    <select name="metric" defaultValue={b.metric} className={inputCls}>
                      {METRICS.map((m) => (
                        <option key={m} value={m}>{METRIC_LABEL[m]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="w-24">
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">Al llegar a</span>
                    <input name="threshold" type="number" min={1} defaultValue={b.threshold} className={inputCls} />
                  </label>
                </div>
                <SubmitButton className="tap-bounce mt-2 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                  Guardar
                </SubmitButton>
              </form>
              <form action={deleteBadge} className="mt-1 text-right">
                <input type="hidden" name="id" value={b.id} />
                {kid && <input type="hidden" name="kid" value={kid} />}
                <ConfirmSubmit
                  message={`¿Borrar el logro «${b.label}»?`}
                  className="text-xs font-semibold text-rose-400 underline underline-offset-2"
                >
                  Borrar
                </ConfirmSubmit>
              </form>
            </div>
          ))}

          {/* Añadir logro */}
          <form action={addBadge} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
            {kid && <input type="hidden" name="kid" value={kid} />}
            <span className="font-display text-sm font-bold text-[var(--ink)]">➕ Añadir logro</span>
            <div className="mt-2 flex items-center gap-2">
              <EmojiInput name="icon" defaultValue="🏅" suggestions={BADGE_ICONS} />
              <input name="label" className={`${inputCls} flex-1 font-display font-bold`} placeholder="Nombre del logro" required />
            </div>
            <div className="mt-2 flex items-end gap-2">
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Se gana por</span>
                <select name="metric" defaultValue="tasks" className={inputCls}>
                  {METRICS.map((m) => (
                    <option key={m} value={m}>{METRIC_LABEL[m]}</option>
                  ))}
                </select>
              </label>
              <label className="w-24">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Al llegar a</span>
                <input name="threshold" type="number" min={1} defaultValue={10} className={inputCls} />
              </label>
            </div>
            <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
              Añadir logro
            </SubmitButton>
          </form>
        </div>
      </div>
    </ThemeShell>
  )
}
