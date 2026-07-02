import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { suggestions } from '@/lib/db/schema'
import { requireAccountPage } from '@/lib/session'
import { sendSuggestion } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

export default async function SugerenciasPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const ownerId = Number(process.env.SUGGESTIONS_ACCOUNT_ID) || 1
  const isOwner = accountId === ownerId
  const list = isOwner
    ? await db.select().from(suggestions).orderBy(desc(suggestions.createdAt)).limit(50)
    : []

  return (
    <ThemeShell theme="infantil">
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <div className="flex items-center justify-between px-4 pt-2">
          <h1 className="font-display text-xl font-bold text-[var(--head)]">💡 Sugerencias y peticiones</h1>
          <Link href="/tareas" className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
            ← Ajustes
          </Link>
        </div>
        <p className="px-4 pt-1 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          ¿Se te ocurre algo para mejorar la app? Puedes sugerir de forma <b>anónima</b> cambios, mejoras,
          iconos nuevos… lo que quieras. No se muestra quién lo envía.
        </p>

        {sp.sent && (
          <p className="mx-3 mt-3 rounded-2xl bg-emerald-100 px-3 py-2 text-center text-sm font-bold text-emerald-700">
            ¡Gracias! Tu sugerencia se ha enviado. 🙌
          </p>
        )}

        <form action={sendSuggestion} className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <textarea
            name="text"
            required
            rows={4}
            maxLength={2000}
            placeholder="Escribe aquí tu sugerencia o petición…"
            className="w-full rounded-xl border-2 border-indigo-100 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-indigo-600 py-2 font-display text-sm font-bold text-white">
            Enviar sugerencia
          </SubmitButton>
        </form>

        {isOwner && (
          <>
            <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">Recibidas ({list.length})</h2>
            <div className="mx-3 mt-2 space-y-2">
              {list.length === 0 && (
                <div className="rounded-3xl bg-[var(--card)] p-4 text-center text-sm text-[var(--ink-2)] shadow-md">
                  Todavía no hay sugerencias.
                </div>
              )}
              {list.map((s) => (
                <div key={s.id} className="rounded-2xl bg-[var(--card)] px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{s.text}</p>
                  <p className="mt-1 text-[10px] font-semibold text-[var(--ink-3)]">
                    {new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ThemeShell>
  )
}
