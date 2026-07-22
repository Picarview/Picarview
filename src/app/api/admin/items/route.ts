import { NextResponse } from 'next/server'
import {
  extensionFor,
  getCmsEnv,
  isSameOrigin,
  publicCmsItem,
  readCookie,
  safeImageBytes,
  safeImageType,
  SESSION_COOKIE,
  verifyAdminSession,
  type CmsItem,
  type CmsProjectMedia,
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
    `SELECT id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published, created_at
     FROM content_items ORDER BY type ASC, sort_order ASC, created_at DESC`
  ).all<CmsItem>()

  const mediaQuery = await CMS_DB.prepare(
    `SELECT id, project_id, alt_text, object_key, sort_order, created_at
     FROM project_media ORDER BY project_id ASC, sort_order ASC, created_at ASC`
  ).all<CmsProjectMedia>()
  const mediaByProject = new Map<string, CmsProjectMedia[]>()
  for (const media of mediaQuery.results ?? []) {
    const projectMedia = mediaByProject.get(media.project_id) ?? []
    projectMedia.push(media)
    mediaByProject.set(media.project_id, projectMedia)
  }

  const items = (query.results ?? []).map((item) => ({
    ...publicCmsItem(item, mediaByProject.get(item.id)),
    published: Boolean(item.published),
  }))
  const industries = [...new Set(items.filter((item) => item.type === 'project').map((item) => item.industry).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))

  return NextResponse.json(
    { items, industries },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) {
    return NextResponse.json({ error: 'D1 or R2 is not configured.' }, { status: 503 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 })
  }

  const form = await request.formData()
  const type = form.get('type')
  const title = String(form.get('title') ?? '').trim()
  const subtitle = String(form.get('subtitle') ?? '').trim()
  const description = String(form.get('description') ?? '').trim()
  const industry = type === 'project' ? String(form.get('industry') ?? '').trim().replace(/\s+/g, ' ') : ''
  const altText = String(form.get('altText') ?? '').trim()
  const published = form.get('published') === 'true' ? 1 : 0
  const submittedFiles = type === 'project' ? form.getAll('images') : [form.get('image')]
  const files = submittedFiles.filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if ((type !== 'partner' && type !== 'project') || !title || !altText || (type === 'project' && !industry) || files.length === 0) {
    return NextResponse.json({ error: 'Type, title, industry, alt text, and image are required for projects.' }, { status: 400 })
  }
  if (title.length > 120 || subtitle.length > 200 || description.length > 1500 || industry.length > 80 || altText.length > 300) {
    return NextResponse.json(
      { error: 'Title must be 120 characters or fewer, subtitle 200, project description 1,500, and image description 300.' },
      { status: 400 }
    )
  }
  if (type === 'partner' && files.length !== 1) {
    return NextResponse.json({ error: 'Partner entries accept one logo.' }, { status: 400 })
  }
  if (type === 'project' && files.length > 8) {
    return NextResponse.json({ error: 'A project can contain up to 8 images.' }, { status: 400 })
  }
  if (files.some((file) => !safeImageType(file) || file.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ error: 'Use PNG, JPG, WebP, or AVIF images up to 10 MB each.' }, { status: 400 })
  }
  if (files.reduce((total, file) => total + file.size, 0) > 48 * 1024 * 1024) {
    return NextResponse.json({ error: 'Keep the combined project gallery below 48 MB.' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const folder = type === 'partner' ? 'partners' : 'projects'
  const objectKeys = files.map((file, index) => `${folder}/${id}${index === 0 ? '' : `-${index + 1}`}.${extensionFor(file)}`)
  const objectKey = objectKeys[0]
  const nextOrder = await CMS_DB.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS value FROM content_items WHERE type = ?'
  ).bind(type).first<{ value: number }>()
  const sortOrder = nextOrder?.value ?? 1

  const uploadedKeys: string[] = []
  try {
    for (const [index, file] of files.entries()) {
      const fileBuffer = await file.arrayBuffer()
      if (!safeImageBytes(new Uint8Array(fileBuffer), file.type)) {
        throw new Error(`Image ${index + 1} is not a valid supported image.`)
      }
      await CMS_MEDIA.put(objectKeys[index], fileBuffer, {
        httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      })
      uploadedKeys.push(objectKeys[index])
    }

    await CMS_DB.prepare(
      `INSERT INTO content_items
       (id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, type, title, subtitle, description, industry, altText, objectKey, sortOrder, published).run()

    for (let index = 1; index < files.length; index += 1) {
      await CMS_DB.prepare(
        `INSERT INTO project_media (id, project_id, alt_text, object_key, sort_order)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        id,
        `${altText} — image ${index + 1}`,
        objectKeys[index],
        index,
      ).run()
    }
  } catch (error) {
    await CMS_DB.prepare('DELETE FROM project_media WHERE project_id = ?').bind(id).run().catch(() => undefined)
    await CMS_DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run().catch(() => undefined)
    await Promise.all(uploadedKeys.map((key) => CMS_MEDIA.delete(key).catch(() => undefined)))
    const message = error instanceof Error ? error.message : 'Unable to save the project gallery.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id, imageCount: files.length }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) return NextResponse.json({ error: 'CMS is not configured.' }, { status: 503 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
  }

  const item = await CMS_DB.prepare('SELECT object_key FROM content_items WHERE id = ?')
    .bind(id).first<{ object_key: string }>()
  if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const gallery = await CMS_DB.prepare('SELECT object_key FROM project_media WHERE project_id = ?')
    .bind(id).all<{ object_key: string }>()

  await CMS_DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run()
  await Promise.all([
    CMS_MEDIA.delete(item.object_key),
    ...(gallery.results ?? []).map((media) => CMS_MEDIA.delete(media.object_key)),
  ])
  return NextResponse.json({ ok: true })
}
