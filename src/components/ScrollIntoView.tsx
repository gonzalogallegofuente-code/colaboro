'use client'

import { useEffect, useRef } from 'react'

// Al montarse (cuando se abre una semana del histórico), lleva la vista hasta
// aquí para que el parte quede visible sin tener que desplazarse a mano.
// La scroll-margin deja hueco para la barra fija de arriba.
export function ScrollIntoView() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  return <div ref={ref} aria-hidden="true" className="scroll-mt-24" />
}
