import Link from 'next/link'
import { logout } from '@/app/actions'

export function Nav({ active }: { active?: 'inicio' | 'historico' | 'tareas' }) {
  const tab = (on?: boolean) =>
    `rounded-full px-3 py-1 transition ${on ? 'bg-gray-900 text-white' : 'text-gray-600'}`
  return (
    <header className="sticky top-0 z-10 mb-1 flex items-center justify-between bg-surface/90 px-3 py-3 backdrop-blur">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-gray-900">
        Colaboro
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/historico" className={tab(active === 'historico')}>
          Histórico
        </Link>
        <Link href="/tareas" className={tab(active === 'tareas')}>
          Tareas
        </Link>
        <form action={logout}>
          <button className="rounded-full px-3 py-1 text-gray-400">Salir</button>
        </form>
      </nav>
    </header>
  )
}
