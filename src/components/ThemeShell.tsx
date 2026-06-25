import type { Theme } from '@/lib/settings'

// Envuelve el contenido de una página con el tema (infantil/juvenil) del hijo
// activo. Define las variables CSS y el fondo en este contenedor.
export function ThemeShell({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <div className={`theme-${theme} min-h-full`} style={{ background: 'var(--app-bg)' }}>
      {children}
    </div>
  )
}
