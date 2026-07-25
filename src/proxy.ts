import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, KID_COOKIE, readSession, readKidToken } from '@/lib/auth'

const PUBLIC = ['/login', '/registro', '/recuperar', '/recuperar/nueva']
// Páginas informativas: visibles siempre (con y sin sesión).
const OPEN = ['/privacidad']

// Rutas SOLO del padre: bloqueadas en modo niño.
function isParentOnly(pathname: string): boolean {
  return (
    pathname.startsWith('/tareas') ||
    pathname === '/recompensas/editar'
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (OPEN.includes(pathname)) return NextResponse.next()
  const secret = process.env.COLABORO_SECRET!
  const session = await readSession(secret, req.cookies.get(SESSION_COOKIE)?.value)
  const kidMode = session ? null : await readKidToken(secret, req.cookies.get(KID_COOKIE)?.value)

  // Login/registro/recuperar se sirven SIEMPRE. Aquí solo se valida la firma
  // de la cookie, no la "versión de contraseña" (eso requiere BD): si tras un
  // cambio de contraseña quedara una cookie vieja y redirigiéramos a "/",
  // se formaría un bucle / → /login → / infinito ("la página no carga").
  // La redirección de un usuario YA logueado la hace la propia página de
  // login con la sesión contrastada de verdad.
  if (PUBLIC.includes(pathname)) return NextResponse.next()

  if (!session && !kidMode) {
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
    // icons/ = SVG de tareas por edad (estáticos, cacheables por el SW sin auth)
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|icon-192.png|icon-512.png|apple-icon.png|robots.txt).*)',
  ],
}
