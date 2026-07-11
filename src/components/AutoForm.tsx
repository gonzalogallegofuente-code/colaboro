'use client'

import { useRef } from 'react'

// Formulario que se guarda SOLO: al salir de un campo (blur) tras haber
// cambiado algo, envía la Server Action. Sin botón Guardar.
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
      onBlur={() => {
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
