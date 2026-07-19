import { NextResponse } from 'next/server'
import {
  extensionFor,
  getCmsEnv,
  isSameOrigin,
  publicCmsItem,
  readCookie,
  safeImageType,
  SESSION_COOKIE,
  verifyAdminSession,
  type CmsItem,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

async function authorized(request: Request) {
  const env = getCmsEnv()
  return verifyAdminSession(readCookie(request, SESSION_COOKIE), env.ADMIN_SESSION_SECRET)
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })

  const query = await CMS_DB.prepare(
    `SELECT id, type, title, subtitle, alt_text, object_key, sort_order, published, created_at
     FROM content_items ORDER BY type ASC, sort_order ASC, created_at DESC`
  ).all<CmsItem>()

  return NextResponse.json({
    items: (query.results ?? []).map((item) => ({ ...publicCmsItem(item), published: Boolean(item.published) })),
  })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) {
    return NextResponse.json({ error: 'D1 or R2 is not configured.' }, { status: 503 })
  }

  const form = await request.formData()
  const type = form.get('type')
  const title = String(form.get('title') ?? '').trim()
  const subtitle = String(form.get('subtitle') ?? '').trim()
  const altText = String(form.get('altText') ?? '').trim()
  const sortOrder = Number(form.get('sortOrder') ?? 0)
  const published = form.get('published') === 'true' ? 1 : 0
  const file = form.get('image')

  if ((type !== 'partner' && type !== 'project') || !title || !altText || !(file instanceof File)) {
    return NextResponse.json({ error: 'Type, title, alt text, and image are required.' }, { status: 400 })
  }
  if (!safeImageType(file) || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Use PNG, JPG, WebP, or AVIF up to 10 MB.' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const objectKey = `${type === 'partner' ? 'partners' : 'projects'}/${id}.${extensionFor(file)}`

  await CMS_MEDIA.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  })

  try {
    await CMS_DB.prepare(
      `INSERT INTO content_items
       (id, type, title, subtitle, alt_text, object_key, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, type, title, subtitle, altText, objectKey, Number.isFinite(sortOrder) ? sortOrder : 0, published).run()
  } catch (error) {
    await CMS_MEDIA.delete(objectKey)
    throw error
  }

  return NextResponse.json({ ok: true, id }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) return NextResponse.json({ error: 'CMS is not configured.' }, { status: 503 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const item = await CMS_DB.prepare('SELECT object_key FROM content_items WHERE id = ?')
    .bind(id).first<{ object_key: string }>()
  if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  await CMS_DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run()
  await CMS_MEDIA.delete(item.object_key)
  return NextResponse.json({ ok: true })
}
