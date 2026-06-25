import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ServiceWorker } from '@/components/ServiceWorker'
import { getTheme } from '@/lib/settings'
import { getAccountId } from '@/lib/session'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['500', '600', '700'] })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-juvenil', weight: ['500', '600', '700'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Colaboro',
  description: 'Tareas de casa — ¡gana premios ayudando!',
  applicationName: 'Colaboro',
  appleWebApp: { capable: true, title: 'Colaboro', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const accountId = await getAccountId()
  const theme = accountId ? await getTheme(accountId) : 'infantil'
  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${nunito.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className={`theme-${theme} h-full font-sans antialiased`}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
