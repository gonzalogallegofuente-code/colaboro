'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

type Props = React.ComponentProps<'button'> & { pendingLabel?: ReactNode }

// Botón de envío que se deshabilita y se atenúa mientras la acción está en curso.
export function SubmitButton({ children, pendingLabel, className, ...rest }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || rest.disabled}
      aria-busy={pending}
      className={`${className ?? ''}${pending ? ' opacity-60' : ''}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
