import Link from 'next/link'
import { logout } from '@/app/actions'

export function Nav({ active }: { active?: 'inicio' | 'historico' | 'tareas' }) {
  const tab = (on?: boolean) =>
    `flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
      on ? 'bg-white text-indigo-700 shadow-sm' : 'bg-white/50 text-indigo-900/70'
    }`
  return (
    <header className="sticky top-0 z-30 mb-2 flex items-center justify-between bg-white/40 px-3 py-3 backdrop-blur-md">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight text-indigo-700">
        ✨ Colaboro
      </Link>
      <nav className="flex items-center gap-1.5">
        <Link href="/historico" className={tab(active === 'historico')} aria-label="Histórico">
          🏆
        </Link>
        <Link href="/tareas" className={tab(active === 'tareas')} aria-label="Tareas">
          ⚙️
        </Link>
        <form action={logout}>
          <button className="rounded-full bg-white/50 px-3 py-1.5 text-sm" aria-label="Salir">
            🚪
          </button>
        </form>
      </nav>
    </header>
  )
}
