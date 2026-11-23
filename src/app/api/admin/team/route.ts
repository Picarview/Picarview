import { NextResponse } from 'next/server'
import {
  extensionFor,
  getCmsEnv,
  isSameOrigin,
  publicTeamMember,
  readCookie,
  safeImageBytes,
  safeImageType,
  SESSION_COOKIE,
  verifyAdminSession,
  type CmsTeamMember,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

async function authorized(request: Request) {
  const env = getCmsEnv()
  return verifyAdminSession(readCookie(request, SESSION_COOKIE), env.ADMIN_SESSION_SECRET)
}

function readFields(get: (key: string) => unknown) {
  const text = (key: string) => {
    const value = get(key)
    return typeof value === 'string' ? value.trim() : ''
  }
  const name = text('name')
  const role = text('role')
  const altText = text('altText')
  const published = text('published') === 'false' ? 0 : 1
  if (!name || !role) return { error: 'Name and role are required.' } as const
  if (name.length > 80 || role.length > 120 || altText.length > 300) return { error: 'Name, role or photo description is too long.' } as const
  return { name, role, altText, published } as const
}

/** Validates and stores an uploaded photo. Returns its R2 key, '' for no file, or an error. */
async function storePhoto(file: unknown, id: string): Promise<{ key: string } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { key: '' }
  const { CMS_MEDIA } = getCmsEnv()
  if (!CMS_MEDIA) return { error: 'Media storage is not configured.' }
  if (!safeImageType(file) || file.size > MAX_PHOTO_BYTES) return { error: 'Use a PNG, JPG, WebP or AVIF photo up to 10 MB.' }
  const buffer = await file.arrayBuffer()
  if (!safeImageBytes(new Uint8Array(buffer), file.type)) return { error: 'The photo is not a valid supported image.' }
  const key = `team/${id}-${crypto.randomUUID()}.${extensionFor(file)}`
  await CMS_MEDIA.put(key, buffer, { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } })
  return { key }
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })
  const query = await CMS_DB.prepare(
    'SELECT id, name, role, object_key, alt_text, sort_order, published, created_at FROM team_members ORDER BY sort_order ASC, created_at ASC'
  ).all<CmsTeamMember>()
  return NextResponse.json(
    { members: (query.results ?? []).map((member) => ({ ...publicTeamMember(member), published: Boolean(member.published) })) },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })
  if (Number(request.headers.get('content-length') ?? 0) > 11 * 1024 * 1024) {
    return NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 })
  }

  const form = await request.formData()
  const fields = readFields((key) => form.get(key))
  if ('error' in fields) return NextResponse.json({ error: fields.error }, { status: 400 })

  const id = crypto.randomUUID()
  const photo = await storePhoto(form.get('photo'), id)
  if ('error' in photo) return NextResponse.json({ error: photo.error }, { status: 400 })

  const next = await CMS_DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS value FROM team_members')
    .first<{ value: number }>()
  try {
    await CMS_DB.prepare(
      'INSERT INTO team_members (id, name, role, object_key, alt_text, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, fields.name, fields.role, photo.key || null, fields.altText || fields.name, next?.value ?? 1, fields.published).run()
  } catch (error) {
    if (photo.key && CMS_MEDIA) await CMS_MEDIA.delete(photo.key)
    throw error
  }
  return NextResponse.json({ ok: true, id }, { status: 201 })
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })
  if (Number(request.headers.get('content-length') ?? 0) > 11 * 1024 * 1024) {
    return NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 })
  }

  const isMultipart = (request.headers.get('content-type') ?? '').includes('multipart/form-data')
  const form = isMultipart ? await request.formData() : null
  const body = form ? Object.fromEntries(form.entries()) as Record<string, unknown> : await request.json() as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })

  const current = await CMS_DB.prepare('SELECT id, object_key, sort_order FROM team_members WHERE id = ?')
    .bind(id).first<{ id: string; object_key: string | null; sort_order: number }>()
  if (!current) return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })

  // Reordering swaps sort positions with the neighbouring member.
  if (body.action === 'move-up' || body.action === 'move-down') {
    const neighbour = await CMS_DB.prepare(
      body.action === 'move-up'
        ? 'SELECT id, sort_order FROM team_members WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1'
        : 'SELECT id, sort_order FROM team_members WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1'
    ).bind(current.sort_order).first<{ id: string; sort_order: number }>()
    if (neighbour) {
      await CMS_DB.prepare('UPDATE team_members SET sort_order = ? WHERE id = ?').bind(neighbour.sort_order, current.id).run()
      await CMS_DB.prepare('UPDATE team_members SET sort_order = ? WHERE id = ?').bind(current.sort_order, neighbour.id).run()
    }
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'publish' || body.action === 'unpublish') {
    await CMS_DB.prepare('UPDATE team_members SET published = ? WHERE id = ?').bind(body.action === 'publish' ? 1 : 0, id).run()
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'remove-photo') {
    await CMS_DB.prepare('UPDATE team_members SET object_key = NULL WHERE id = ?').bind(id).run()
    if (current.object_key && CMS_MEDIA) await CMS_MEDIA.delete(current.object_key)
    return NextResponse.json({ ok: true })
  }

  const fields = readFields((key) => body[key])
  if ('error' in fields) return NextResponse.json({ error: fields.error }, { status: 400 })
  const photo = await storePhoto(form?.get('photo'), id)
  if ('error' in photo) return NextResponse.json({ error: photo.error }, { status: 400 })

  try {
    await CMS_DB.prepare(
      'UPDATE team_members SET name = ?, role = ?, alt_text = ?, published = ?, object_key = COALESCE(?, object_key) WHERE id = ?'
    ).bind(fields.name, fields.role, fields.altText || fields.name, fields.published, photo.key || null, id).run()
  } catch (error) {
    if (photo.key && CMS_MEDIA) await CMS_MEDIA.delete(photo.key)
    throw error
  }
  if (photo.key && current.object_key && CMS_MEDIA) await CMS_MEDIA.delete(current.object_key)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
  const member = await CMS_DB.prepare('SELECT object_key FROM team_members WHERE id = ?').bind(id).first<{ object_key: string | null }>()
  if (!member) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  await CMS_DB.prepare('DELETE FROM team_members WHERE id = ?').bind(id).run()
  if (member.object_key && CMS_MEDIA) await CMS_MEDIA.delete(member.object_key)
  return NextResponse.json({ ok: true })
}
