export const dynamic = 'force-dynamic'

// Clave pública VAPID para que el navegador se suscriba.
export async function GET() {
  return Response.json({ key: process.env.VAPID_PUBLIC_KEY ?? null })
}
