import { NextResponse } from 'next/server'
import {
  createAdminSession,
  getCmsEnv,
  isSameOrigin,
  SESSION_COOKIE,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })

  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = getCmsEnv()
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'Admin secrets are not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as { password?: string } | null
  if (!body?.password || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, await createAdminSession(ADMIN_SESSION_SECRET), {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}
