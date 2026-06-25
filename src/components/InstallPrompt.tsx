'use client'

import { useEffect, useState } from 'react'

// Aviso para instalar la PWA como app. Se oculta si ya está instalada o si se
// descarta. En Android/Chrome ofrece el botón nativo; en iOS, las instrucciones.
export function InstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferred, setDeferred] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const nav = navigator as unknown as { standalone?: boolean }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
    if (standalone) return
    if (localStorage.getItem('colaboro_install_dismiss') === '1') return
    setIsIOS(/ipad|iphone|ipod/i.test(navigator.userAgent))
    setShow(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem('colaboro_install_dismiss', '1')
    setShow(false)
  }
  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl bg-[var(--card)] p-3 shadow-md">
      <span className="text-2xl">📲</span>
      <div className="flex-1 text-xs font-semibold text-[var(--ink-2)]">
        {isIOS ? (
          <>
            Instálala como app: <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.
          </>
        ) : (
          <>Instala Colaboro como app en tu móvil.</>
        )}
      </div>
      {!isIOS && deferred && (
        <button onClick={install} className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">
          Instalar
        </button>
      )}
      <button onClick={dismiss} className="px-1 text-[var(--ink-3)]" aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}
