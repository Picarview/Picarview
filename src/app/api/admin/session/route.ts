import { NextResponse } from 'next/server'
import {
  createAdminSession,
  getCmsEnv,
  isSameOrigin,
  readAdminSession,
  readCookie,
  SESSION_COOKIE,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })

  const { ADMIN_SESSION_SECRET } = getCmsEnv()
  const session = await readAdminSession(readCookie(request, SESSION_COOKIE), ADMIN_SESSION_SECRET)
  if (!session || !ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(
    SESSION_COOKIE,
    await createAdminSession(ADMIN_SESSION_SECRET, session.absoluteExpires),
    {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.max(1, Math.ceil((session.absoluteExpires - Date.now()) / 1000)),
    }
  )
  return response
}
