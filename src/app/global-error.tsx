'use client'

// Último salvavidas: error en la propia plantilla raíz. Aquí no hay CSS de la
// app (se renderiza sin el layout), así que todo va con estilos en línea.
const SOPORTE = 'gonzalo.gallego.fuente@gmail.com'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fb',
          fontFamily: 'system-ui, sans-serif',
          color: '#1f2937',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 56 }}>😅</div>
          <h1 style={{ fontSize: 22, margin: '12px 0 6px' }}>Ups, algo ha fallado</h1>
          <p style={{ fontSize: 14, color: '#5b6472', margin: 0 }}>
            Prueba a reintentar. Si sigue igual, escríbenos a{' '}
            <a href={`mailto:${SOPORTE}`} style={{ color: '#4f46e5', fontWeight: 700 }}>
              {SOPORTE}
            </a>{' '}
            {error?.digest ? `con este código: ${error.digest}` : ''}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 18,
              width: '100%',
              padding: '12px 0',
              borderRadius: 14,
              border: 0,
              background: '#4f46e5',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
