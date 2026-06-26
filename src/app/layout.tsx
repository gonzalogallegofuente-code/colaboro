import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ServiceWorker } from '@/components/ServiceWorker'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['500', '600', '700'] })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-juvenil', weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Colaboro',
  description: 'Tareas de casa — ¡gana premios ayudando!',
  applicationName: 'Colaboro',
  appleWebApp: { capable: true, title: 'Colaboro', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // El tema (infantil/juvenil) lo pone cada página con <ThemeShell> según el
  // hijo activo. El body lleva el infantil como base.
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="theme-infantil h-full font-sans antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
