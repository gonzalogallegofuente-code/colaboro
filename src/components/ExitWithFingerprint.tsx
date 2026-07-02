'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startAuthentication } from '@simplewebauthn/browser'
import { authOptions, authVerify } from '@/app/webauthn-actions'

export function ExitWithFingerprint() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'busy' | 'none' | 'err'>('idle')

  async function run() {
    setStatus('busy')
    try {
      const opt = await authOptions()
      if (!opt.ok || !opt.options) {
        setStatus(opt.reason === 'none' ? 'none' : 'err')
        return
      }
      const authResp = await startAuthentication({ optionsJSON: opt.options })
      const res = await authVerify(authResp)
      if (res.ok) {
        router.push('/')
        router.refresh()
        return
      }
      setStatus('err')
    } catch {
      setStatus('err')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={status === 'busy'}
        className="tap-bounce w-full rounded-xl bg-indigo-600 py-2.5 font-display text-base font-bold text-white disabled:opacity-50"
      >
        {status === 'busy' ? 'Comprobando…' : '👆 Modo adulto con huella'}
      </button>
      {status === 'none' && (
        <p className="mt-1 text-center text-[11px] font-semibold text-[var(--ink-3)]">
          Aún no has activado la huella. Actívala en Ajustes → Cuenta con tu sesión de padre.
        </p>
      )}
      {status === 'err' && (
        <p className="mt-1 text-center text-[11px] font-bold text-rose-500">
          No se pudo con la huella. Usa la contraseña de abajo.
        </p>
      )}
    </div>
  )
}
