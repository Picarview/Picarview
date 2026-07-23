import { NextResponse } from 'next/server'
import {
  createAdminSession,
  ADMIN_ABSOLUTE_TIMEOUT_MS,
  getCmsEnv,
  isSameOrigin,
  SESSION_COOKIE,
  timingSafeTextEqual,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 4096) return NextResponse.json({ error: 'Invalid request.' }, { status: 413 })

  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET, CMS_DB } = getCmsEnv()
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET || !CMS_DB) {
    return NextResponse.json({ error: 'Admin secrets are not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as { password?: string } | null
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password || password.length > 512) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const now = Date.now()
  const cutoff = now - LOGIN_WINDOW_MS
  const clientKey = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const attempts = await CMS_DB.prepare(
    'SELECT attempts, window_started FROM admin_login_attempts WHERE client_key = ?'
  ).bind(clientKey).first<{ attempts: number; window_started: number }>()

  if (attempts && attempts.window_started > cutoff && attempts.attempts >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((attempts.window_started + LOGIN_WINDOW_MS - now) / 1000))
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } }
    )
  }

  if (!await timingSafeTextEqual(password, ADMIN_PASSWORD)) {
    await CMS_DB.prepare(
      `INSERT INTO admin_login_attempts (client_key, attempts, window_started)
       VALUES (?, 1, ?)
       ON CONFLICT(client_key) DO UPDATE SET
         attempts = CASE WHEN window_started <= ? THEN 1 ELSE attempts + 1 END,
         window_started = CASE WHEN window_started <= ? THEN ? ELSE window_started END`
    ).bind(clientKey, now, cutoff, cutoff, now).run()
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  await CMS_DB.prepare('DELETE FROM admin_login_attempts WHERE client_key = ?').bind(clientKey).run()

  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, await createAdminSession(ADMIN_SESSION_SECRET), {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_ABSOLUTE_TIMEOUT_MS / 1000,
  })
  return response
}
