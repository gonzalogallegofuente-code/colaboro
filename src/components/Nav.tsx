import Link from 'next/link'
import { logout } from '@/app/actions'
import { ConfirmButton } from '@/components/ConfirmButton'

export function Nav({
  active,
  kidMode,
}: {
  active?: 'inicio' | 'semana' | 'recompensas' | 'historico' | 'tareas' | 'logros'
  kidMode?: boolean
}) {
  const tab = (on?: boolean) =>
    `flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
      on ? 'bg-[var(--card)] text-[var(--head)] shadow-sm' : 'text-[var(--ink-2)]'
    }`
  return (
    <header className="sticky top-0 z-30 mb-2 flex items-center justify-between bg-[var(--nav)] px-3 py-3 backdrop-blur-md">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--head)]">
        ✨ Colaboro
      </Link>
      <nav className="flex items-center gap-1.5">
        <Link href="/semana" className={tab(active === 'semana')} aria-label="Parte semanal">
          📅
        </Link>
        <Link href="/recompensas" className={tab(active === 'recompensas')} aria-label="Recompensas">
          🎁
        </Link>
        {kidMode && (
          <Link href="/logros" className={tab(active === 'logros')} aria-label="Logros">
            🏅
          </Link>
        )}
        {!kidMode && (
          <Link href="/historico" className={tab(active === 'historico')} aria-label="Histórico">
            🏆
          </Link>
        )}
        {!kidMode && (
          <Link href="/tareas" className={tab(active === 'tareas')} aria-label="Tareas">
            ⚙️
          </Link>
        )}
        {kidMode ? (
          <Link href="/salir" className="rounded-full px-3 py-1.5 text-sm text-[var(--ink-3)]" aria-label="Salir del modo niño">
            🚪
          </Link>
        ) : (
          <form action={logout}>
            <ConfirmButton
              message="¿Seguro que quieres cerrar sesión?"
              className="rounded-full px-3 py-1.5 text-sm text-[var(--ink-3)]"
              ariaLabel="Salir"
            >
              🚪
            </ConfirmButton>
          </form>
        )}
      </nav>
    </header>
  )
}
