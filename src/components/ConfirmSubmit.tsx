'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

// Botón de envío que pide confirmación antes de ejecutar la acción.
export function ConfirmSubmit({
  message,
  children,
  className,
  disabled,
}: {
  message: string
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className={`${className ?? ''}${pending ? ' opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}
