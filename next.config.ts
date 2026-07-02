import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// Raíz del proyecto. Colaboro vive dentro de la carpeta de workdesk (que tiene
// su propio lockfile), así que fijamos la raíz para que Turbopack no la confunda.
const root = dirname(fileURLToPath(import.meta.url))

// Si algún día se sirve bajo un subpath (p.ej. /colaboro) en vez de un
// subdominio propio, basta con definir BASE_PATH en el entorno de build.
const basePath = process.env.BASE_PATH || undefined

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath,
  turbopack: { root },
  async headers() {
    return [
      {
        // Cabeceras de seguridad para toda la app.
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
