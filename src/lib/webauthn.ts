import { headers } from 'next/headers'

// RP ID (dominio) y origin. Preferimos COLABORO_ORIGIN (fijo y exacto, evita
// depender de las cabeceras de Traefik); si no, lo reconstruimos de la petición.
export async function rpInfo(): Promise<{ rpID: string; origin: string }> {
  const envOrigin = process.env.COLABORO_ORIGIN
  if (envOrigin) {
    const origin = envOrigin.replace(/\/$/, '')
    return { rpID: new URL(origin).hostname, origin }
  }
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const rpID = host.split(':')[0] // dominio sin puerto
  const proto = h.get('x-forwarded-proto') || (rpID === 'localhost' ? 'http' : 'https')
  return { rpID, origin: `${proto}://${host}` }
}

export const RP_NAME = 'Colaboro'
