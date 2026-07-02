import Link from 'next/link'
import { logout } from '@/app/actions'
import { ConfirmButton } from '@/components/ConfirmButton'

export function Nav({
  active,
  kidMode,
}: {
  active?: 'inicio' | 'modo' | 'recompensas' | 'historico' | 'tareas' | 'logros'
  kidMode?: boolean
}) {
  const tab = (on?: boolean) =>
    `flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold transition ${
      on ? 'bg-[var(--card)] text-[var(--head)] shadow-sm' : 'text-[var(--ink-2)]'
    }`
  return (
    <header className="sticky top-0 z-30 mb-2 flex items-center justify-between bg-[var(--nav)] px-3 py-3 backdrop-blur-md">
      <Link
        href="/"
        aria-label="Ir al inicio"
        className="tap-bounce flex items-center gap-1.5 rounded-full font-display text-2xl font-bold tracking-tight text-[var(--head)]"
      >
        <span aria-hidden="true">🏠</span>
        Colaboro
      </Link>
      <nav className="flex items-center gap-1.5">
        <Link href="/recompensas" className={tab(active === 'recompensas')} aria-label="Recompensas">
          🎁
        </Link>
        {kidMode && (
          <Link href="/logros" className={tab(active === 'logros')} aria-label="Logros">
            🏅
          </Link>
        )}
        <Link href="/historico" className={tab(active === 'historico')} aria-label="Histórico">
          📅
        </Link>
        {!kidMode && (
          <Link href="/modo" className={tab(active === 'modo')} aria-label="Modo niño">
            📱
          </Link>
        )}
        {!kidMode && (
          <Link href="/tareas" className={tab(active === 'tareas')} aria-label="Tareas">
            ⚙️
          </Link>
        )}
        {kidMode ? (
          <Link href="/salir" className="rounded-full px-2.5 py-1.5 text-sm text-[var(--ink-3)]" aria-label="Modo adulto">
            👤
          </Link>
        ) : (
          <form action={logout}>
            <ConfirmButton
              message="¿Seguro que quieres cerrar sesión?"
              className="rounded-full px-2.5 py-1.5 text-sm text-[var(--ink-3)]"
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
