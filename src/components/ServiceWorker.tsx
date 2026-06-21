'use client'

import { useEffect } from 'react'

// Registra el service worker para que la app sea instalable en el móvil.
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
