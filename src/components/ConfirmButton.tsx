'use client'

import { useFormStatus } from 'react-dom'

// Botón de envío que pide confirmación (OK/Cancelar) antes de enviar el
// formulario. Si se cancela, no se ejecuta la Server Action.
export function ConfirmButton({
  message,
  className,
  ariaLabel,
  children,
}: {
  message: string
  className?: string
  ariaLabel?: string
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className={className}
    >
      {children}
    </button>
  )
}
