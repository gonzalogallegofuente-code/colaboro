import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorker } from '@/components/ServiceWorker'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Colaboro',
  description: 'Tareas de casa — contador de Leo y Eliot',
  applicationName: 'Colaboro',
  appleWebApp: { capable: true, title: 'Colaboro', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
