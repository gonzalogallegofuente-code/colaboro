'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { SLUG_GRUPOS, type Edad } from '@/lib/edad-icons'

// "Cambiar dibujo": el icono actual es tocable y abre una galería con todos
// los dibujos de la edad del hijo. Elegir uno lo FIJA (icon_slug); «Automático»
// vuelve a la asignación por nombre. Con autoSubmit guarda al momento (igual
// que el resto del formulario de edición).
export function SlugPicker({
  edad,
  defaultSlug,
  fallbackSrc,
  size = 40,
  autoSubmit,
  children,
}: {
  edad: Edad
  defaultSlug: string | null
  fallbackSrc: string // icono automático actual (si no hay dibujo fijado)
  size?: number
  autoSubmit?: boolean
  children: React.ReactNode
}) {
  const [slug, setSlug] = useState<string | null>(defaultSlug)
  const [open, setOpen] = useState(false)
  const hiddenRef = useRef<HTMLInputElement>(null)

  const elegir = (s: string | null) => {
    flushSync(() => {
      setSlug(s)
      setOpen(false)
    })
    if (autoSubmit) hiddenRef.current?.form?.requestSubmit()
  }

  const src = slug ? `/icons/${edad}/${slug}.svg` : fallbackSrc

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="tap-bounce relative shrink-0 rounded-xl p-0.5"
          aria-label="Cambiar dibujo"
          title="Cambiar dibujo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[9px] text-indigo-600">
            ▾
          </span>
        </button>
        {children}
      </div>
      <input ref={hiddenRef} type="hidden" name="iconSlug" value={slug ?? ''} />

      {open && (
        <div className="mt-2 rounded-2xl border-2 border-indigo-100 bg-[var(--card)] p-2.5">
          <button
            type="button"
            onClick={() => elegir(null)}
            className={`tap-bounce mb-1 w-full rounded-xl px-2 py-1.5 text-left font-display text-xs font-bold ${
              slug === null ? 'bg-indigo-600 text-white' : 'bg-[var(--chip)] text-[var(--chip-ink)]'
            }`}
          >
            ✨ Automático (según el nombre)
          </button>
          {SLUG_GRUPOS.map((g) => (
            <div key={g.label}>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-3)]">{g.label}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {g.slugs.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => elegir(s.slug)}
                    title={s.label}
                    aria-label={s.label}
                    className={`tap-bounce flex aspect-square items-center justify-center rounded-xl ${
                      slug === s.slug ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/icons/${edad}/${s.slug}.svg`}
                      alt=""
                      loading="lazy"
                      width={30}
                      height={30}
                      style={{ width: 30, height: 30, objectFit: 'contain' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
