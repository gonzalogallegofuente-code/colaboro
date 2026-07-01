'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { registerOptions, registerVerify } from '@/app/webauthn-actions'

export function RegisterFingerprint() {
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')

  async function run() {
    setStatus('busy')
    try {
      const options = await registerOptions()
      const attResp = await startRegistration({ optionsJSON: options })
      const res = await registerVerify(attResp)
      setStatus(res.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  return (
    <div className="mt-3">
      <p className="mb-1 text-[11px] font-semibold text-[var(--ink-3)]">
        Activa tu huella para salir del modo niño sin escribir la contraseña. La huella se queda en este móvil.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={status === 'busy'}
        className="tap-bounce rounded-xl border-2 border-indigo-200 px-3 py-1.5 text-sm font-bold text-indigo-600 disabled:opacity-50"
      >
        {status === 'busy' ? 'Activando…' : '👆 Activar huella'}
      </button>
      {status === 'ok' && (
        <p className="mt-1 text-[11px] font-bold text-emerald-600">✓ Huella activada en este móvil.</p>
      )}
      {status === 'err' && (
        <p className="mt-1 text-[11px] font-bold text-rose-500">
          No se pudo activar. Comprueba que este móvil tiene huella (o cara) configurada.
        </p>
      )}
    </div>
  )
}
