import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, KID_COOKIE, readSession, readKidToken } from '@/lib/auth'

const PUBLIC = ['/login', '/registro']

// Rutas SOLO del padre: bloqueadas en modo niño.
function isParentOnly(pathname: string): boolean {
  return (
    pathname.startsWith('/tareas') ||
    pathname.startsWith('/historico') ||
    pathname === '/recompensas/editar'
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.COLABORO_SECRET!
  const accountId = await readSession(secret, req.cookies.get(SESSION_COOKIE)?.value)
  const kidMode = accountId ? null : await readKidToken(secret, req.cookies.get(KID_COOKIE)?.value)

  if (PUBLIC.includes(pathname)) {
    if (accountId || kidMode) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }

  if (!accountId && !kidMode) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // En modo niño no se entra a los ajustes ni a editar.
  if (kidMode && isParentOnly(pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-192.png|icon-512.png|apple-icon.png|robots.txt).*)',
  ],
}
