import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, readSession } from '@/lib/auth'

const PUBLIC = ['/login', '/registro']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accountId = await readSession(process.env.COLABORO_SECRET!, req.cookies.get(SESSION_COOKIE)?.value)

  if (PUBLIC.includes(pathname)) {
    if (accountId) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }

  if (!accountId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-192.png|icon-512.png|apple-icon.png|robots.txt).*)',
  ],
}
