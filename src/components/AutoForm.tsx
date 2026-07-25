'use client'

import { useRef } from 'react'

// Formulario que se guarda SOLO: al salir del formulario (blur hacia fuera)
// tras haber cambiado algo, envía la Server Action. Sin botón Guardar.
// OJO: saltar de un campo a OTRO del mismo formulario NO guarda todavía
// (si guardara a medias, actions como el objetivo familiar interpretarían
// el campo aún vacío como "borrar").
export function AutoForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLFormElement>(null)
  const dirty = useRef(false)
  return (
    <form
      ref={ref}
      action={action}
      className={className}
      onChange={() => {
        dirty.current = true
      }}
      onBlur={(e) => {
        if (e.relatedTarget && ref.current?.contains(e.relatedTarget as Node)) return
        if (dirty.current) {
          dirty.current = false
          ref.current?.requestSubmit()
        }
      }}
    >
      {children}
    </form>
  )
}
