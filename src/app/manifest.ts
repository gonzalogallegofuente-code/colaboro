import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Colaboro — Tareas de casa',
    short_name: 'Colaboro',
    description: 'Contador de tareas de casa de Leo y Eliot',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f6fb',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
