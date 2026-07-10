import { sendToAccount } from '@/lib/push'

export const dynamic = 'force-dynamic'

// Aviso por push al DUEÑO de la instancia (cuenta SUGGESTIONS_ACCOUNT_ID).
// Lo usa el vigilante del VPS (scripts/watchdog.sh) cuando ve errores en los
// logs. Solo por cabecera x-cron-secret.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('no autorizado', { status: 401 })
  }
  let body = ''
  try {
    const j = (await req.json()) as { body?: string }
    body = String(j.body ?? '').slice(0, 300)
  } catch {
    /* cuerpo inválido → se ignora */
  }
  if (!body) return Response.json({ ok: false, error: 'sin mensaje' }, { status: 400 })

  const owner = Number(process.env.SUGGESTIONS_ACCOUNT_ID) || 1
  const sent = await sendToAccount(owner, {
    title: '⚠️ Colaboro — aviso del vigilante',
    body,
    url: '/',
  })
  return Response.json({ ok: true, sent })
}
