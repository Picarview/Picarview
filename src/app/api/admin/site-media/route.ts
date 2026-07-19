import { NextResponse } from 'next/server'
import {
  extensionFor,
  getCmsEnv,
  isSameOrigin,
  readCookie,
  safeImageBytes,
  safeImageType,
  safeVideoBytes,
  safeVideoType,
  SESSION_COOKIE,
  verifyAdminSession,
  type CmsSiteMedia,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

const slots = ['hero', 'expression-1', 'expression-2', 'expression-3', 'expression-4'] as const
type SiteSlot = typeof slots[number]

function isSlot(value: FormDataEntryValue | string | null): value is SiteSlot {
  return typeof value === 'string' && slots.includes(value as SiteSlot)
}

async function authorized(request: Request) {
  const env = getCmsEnv()
  return verifyAdminSession(readCookie(request, SESSION_COOKIE), env.ADMIN_SESSION_SECRET)
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })

  const query = await CMS_DB.prepare(
    'SELECT slot, media_type, title, alt_text, object_key, mime_type, updated_at FROM site_media ORDER BY slot'
  ).all<CmsSiteMedia>()

  return NextResponse.json({
    items: (query.results ?? []).map((item) => ({
      slot: item.slot,
      mediaType: item.media_type,
      title: item.title,
      altText: item.alt_text,
      mediaUrl: `/api/cms/media?key=${encodeURIComponent(item.object_key)}`,
      updatedAt: item.updated_at,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 42 * 1024 * 1024) {
    return NextResponse.json({ error: 'Media request is too large.' }, { status: 413 })
  }

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) return NextResponse.json({ error: 'CMS is not configured.' }, { status: 503 })

  const form = await request.formData()
  const slot = form.get('slot')
  const title = String(form.get('title') ?? '').trim()
  const altText = String(form.get('altText') ?? '').trim()
  const file = form.get('media')

  if (!isSlot(slot) || !(file instanceof File) || !altText) {
    return NextResponse.json({ error: 'Slot, description, and media file are required.' }, { status: 400 })
  }
  if (title.length > 120 || altText.length > 300) {
    return NextResponse.json({ error: 'Title must be 120 characters or fewer and description 300.' }, { status: 400 })
  }

  const isImage = safeImageType(file)
  const isVideo = safeVideoType(file)
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Use PNG, JPG, WebP, AVIF, MP4, or WebM.' }, { status: 400 })
  }
  if (slot !== 'hero' && !isImage) {
    return NextResponse.json({ error: 'Selected-expression slots accept images only.' }, { status: 400 })
  }

  const maximumSize = isVideo ? 40 * 1024 * 1024 : 10 * 1024 * 1024
  if (!file.size || file.size > maximumSize) {
    return NextResponse.json(
      { error: isVideo ? 'Hero videos must be 40 MB or smaller.' : 'Images must be 10 MB or smaller.' },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if ((isImage && !safeImageBytes(bytes, file.type)) || (isVideo && !safeVideoBytes(bytes, file.type))) {
    return NextResponse.json({ error: 'The file contents do not match a supported media format.' }, { status: 400 })
  }

  const previous = await CMS_DB.prepare('SELECT object_key FROM site_media WHERE slot = ?')
    .bind(slot).first<{ object_key: string }>()
  const objectKey = `site/${slot}/${crypto.randomUUID()}.${extensionFor(file)}`

  await CMS_MEDIA.put(objectKey, buffer, {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  })

  try {
    await CMS_DB.prepare(
      `INSERT INTO site_media (slot, media_type, title, alt_text, object_key, mime_type, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(slot) DO UPDATE SET
         media_type = excluded.media_type,
         title = excluded.title,
         alt_text = excluded.alt_text,
         object_key = excluded.object_key,
         mime_type = excluded.mime_type,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(slot, isVideo ? 'video' : 'image', title, altText, objectKey, file.type).run()
  } catch (error) {
    await CMS_MEDIA.delete(objectKey)
    throw error
  }

  if (previous?.object_key && previous.object_key !== objectKey) await CMS_MEDIA.delete(previous.object_key)
  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const slot = new URL(request.url).searchParams.get('slot')
  if (!isSlot(slot)) return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) return NextResponse.json({ error: 'CMS is not configured.' }, { status: 503 })
  const item = await CMS_DB.prepare('SELECT object_key FROM site_media WHERE slot = ?')
    .bind(slot).first<{ object_key: string }>()
  if (!item) return NextResponse.json({ error: 'This slot already uses its default media.' }, { status: 404 })

  await CMS_DB.prepare('DELETE FROM site_media WHERE slot = ?').bind(slot).run()
  await CMS_MEDIA.delete(item.object_key)
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
