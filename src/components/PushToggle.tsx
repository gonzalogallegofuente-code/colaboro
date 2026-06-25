'use client'
import { useEffect, useState } from 'react'
import { saveSubscription, removeSubscription } from '@/app/actions'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function PushToggle() {
  const [supported, setSupported] = useState(true)
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setSupported(false)
      return
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOn(!!sub))
      .catch(() => {})
  }, [])

  async function enable() {
    setBusy(true)
    setMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setMsg('No diste permiso para los avisos.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const { key } = await fetch('/api/push/key').then((r) => r.json())
      if (!key) {
        setMsg('Los avisos aún no están configurados en el servidor.')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      const j = sub.toJSON()
      await saveSubscription({
        endpoint: j.endpoint!,
        keys: { p256dh: j.keys!.p256dh, auth: j.keys!.auth },
      })
      setOn(true)
      setMsg('¡Avisos activados! 🔔')
    } catch {
      setMsg('No se pudieron activar los avisos.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setMsg(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removeSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setOn(false)
      setMsg('Avisos desactivados.')
    } catch {
      setMsg('No se pudieron desactivar.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-[11px] font-semibold text-[var(--ink-3)]">
        Este navegador no admite avisos. En iPhone, primero instala Colaboro en la pantalla de inicio.
      </p>
    )
  }

  return (
    <div>
      <button
        onClick={on ? disable : enable}
        disabled={busy}
        className={`tap-bounce w-full rounded-xl py-2 font-display text-sm font-bold disabled:opacity-50 ${
          on ? 'border-2 border-indigo-200 text-indigo-600' : 'bg-indigo-600 text-white'
        }`}
      >
        {busy ? '…' : on ? '🔕 Desactivar avisos' : '🔔 Activar avisos'}
      </button>
      {msg && <p className="mt-1 text-[11px] font-semibold text-[var(--ink-3)]">{msg}</p>}
    </div>
  )
}
