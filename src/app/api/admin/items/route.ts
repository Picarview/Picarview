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
  type CmsProjectImage,
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
    `SELECT id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published, archived, pinned, created_at
     FROM content_items ORDER BY type ASC, sort_order ASC, created_at DESC`
  ).all<CmsItem>()

  const imageQuery = await CMS_DB.prepare(
    `SELECT id, project_id, object_key, alt_text, sort_order, created_at
     FROM project_images ORDER BY project_id, sort_order ASC, created_at ASC`
  ).all<CmsProjectImage>()
  const imagesByProject = new Map<string, Array<{ id: string; imageUrl: string; altText: string; sortOrder: number }>>()
  for (const image of imageQuery.results ?? []) {
    const images = imagesByProject.get(image.project_id) ?? []
    images.push({ id: image.id, imageUrl: `/api/cms/media?key=${encodeURIComponent(image.object_key)}`, altText: image.alt_text, sortOrder: image.sort_order })
    imagesByProject.set(image.project_id, images)
  }

  const items = (query.results ?? []).map((item) => ({
    ...publicCmsItem(item),
    published: Boolean(item.published),
    archived: Boolean(item.archived),
    pinned: Boolean(item.pinned),
    images: item.type === 'project' ? imagesByProject.get(item.id) ?? [] : [],
  }))
  const industries = [...new Set(items.filter((item) => item.type === 'project').map((item) => item.industry).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))

  return NextResponse.json(
    { items, industries },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })

  const contentType = request.headers.get('content-type') ?? ''
  const isMultipart = contentType.includes('multipart/form-data')
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 51 * 1024 * 1024) {
    return NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 })
  }
  const submittedForm = isMultipart ? await request.formData() : null
  const body = submittedForm
    ? Object.fromEntries(submittedForm.entries()) as Record<string, unknown>
    : await request.json() as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  const action = body.action
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
  }

  if (action === 'archive') {
    await CMS_DB.prepare('UPDATE content_items SET archived = 1, published = 0, pinned = 0 WHERE id = ? AND type = ?')
      .bind(id, 'project').run()
    return NextResponse.json({ ok: true })
  }
  if (action === 'restore') {
    await CMS_DB.prepare('UPDATE content_items SET archived = 0 WHERE id = ? AND type = ?')
      .bind(id, 'project').run()
    return NextResponse.json({ ok: true })
  }
  if (action === 'pin' || action === 'unpin') {
    await CMS_DB.prepare('UPDATE content_items SET pinned = ? WHERE id = ? AND type = ? AND archived = 0')
      .bind(action === 'pin' ? 1 : 0, id, 'project').run()
    return NextResponse.json({ ok: true })
  }
  if (action === 'publish' || action === 'unpublish') {
    await CMS_DB.prepare('UPDATE content_items SET published = ? WHERE id = ? AND archived = 0')
      .bind(action === 'publish' ? 1 : 0, id).run()
    return NextResponse.json({ ok: true })
  }
  if (action === 'add-images') {
    if (!submittedForm || !CMS_MEDIA) return NextResponse.json({ error: 'Media storage is not configured.' }, { status: 503 })
    const files = submittedForm.getAll('images').filter((entry): entry is File => entry instanceof File && entry.size > 0)
    const galleryAltText = String(submittedForm.get('galleryAltText') ?? '').trim()
    if (!files.length || files.length > 5) return NextResponse.json({ error: 'Choose between one and five images.' }, { status: 400 })
    if (galleryAltText.length > 300 || files.some((file) => !safeImageType(file) || file.size > 10 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Use up to five PNG, JPG, WebP, or AVIF images, each no larger than 10 MB.' }, { status: 400 })
    }
    const currentCount = await CMS_DB.prepare('SELECT COUNT(*) AS value FROM project_images WHERE project_id = ?')
      .bind(id).first<{ value: number }>()
    if ((currentCount?.value ?? 0) + files.length > 12) return NextResponse.json({ error: 'A project can contain up to 12 images.' }, { status: 400 })
    const nextOrder = await CMS_DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM project_images WHERE project_id = ?')
      .bind(id).first<{ value: number }>()
    const uploaded: Array<{ imageId: string; objectKey: string }> = []
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const bytes = new Uint8Array(await file.arrayBuffer())
        if (!safeImageBytes(bytes, file.type)) throw new Error('One of the selected files is not a valid supported image.')
        const imageId = crypto.randomUUID()
        const objectKey = `projects/${id}/${imageId}.${extensionFor(file)}`
        await CMS_MEDIA.put(objectKey, bytes.buffer, { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } })
        uploaded.push({ imageId, objectKey })
        await CMS_DB.prepare(
          'INSERT INTO project_images (id, project_id, object_key, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)'
        ).bind(imageId, id, objectKey, galleryAltText, (nextOrder?.value ?? 0) + index).run()
      }
    } catch (error) {
      for (const uploadedImage of uploaded) {
        await CMS_DB.prepare('DELETE FROM project_images WHERE id = ?').bind(uploadedImage.imageId).run()
        await CMS_MEDIA.delete(uploadedImage.objectKey)
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to add project images.' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }
  if (action === 'replace-image') {
    if (!submittedForm || !CMS_MEDIA) return NextResponse.json({ error: 'Media storage is not configured.' }, { status: 503 })
    const imageId = String(submittedForm.get('imageId') ?? '')
    const file = submittedForm.get('image')
    if (!(file instanceof File) || !safeImageType(file) || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Use PNG, JPG, WebP, or AVIF up to 10 MB.' }, { status: 400 })
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!safeImageBytes(bytes, file.type)) return NextResponse.json({ error: 'The replacement is not a valid supported image.' }, { status: 400 })
    const current = await CMS_DB.prepare('SELECT object_key, sort_order FROM project_images WHERE id = ? AND project_id = ?')
      .bind(imageId, id).first<{ object_key: string; sort_order: number }>()
    if (!current) return NextResponse.json({ error: 'Project image not found.' }, { status: 404 })
    const objectKey = `projects/${id}/${crypto.randomUUID()}.${extensionFor(file)}`
    await CMS_MEDIA.put(objectKey, bytes.buffer, { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } })
    try {
      await CMS_DB.prepare('UPDATE project_images SET object_key = ? WHERE id = ? AND project_id = ?').bind(objectKey, imageId, id).run()
      if (current.sort_order === 0) await CMS_DB.prepare('UPDATE content_items SET object_key = ? WHERE id = ?').bind(objectKey, id).run()
    } catch (error) {
      await CMS_MEDIA.delete(objectKey)
      throw error
    }
    await CMS_MEDIA.delete(current.object_key)
    return NextResponse.json({ ok: true })
  }
  if (action === 'remove-image') {
    if (!CMS_MEDIA) return NextResponse.json({ error: 'Media storage is not configured.' }, { status: 503 })
    const imageId = typeof body.imageId === 'string' ? body.imageId : ''
    const count = await CMS_DB.prepare('SELECT COUNT(*) AS value FROM project_images WHERE project_id = ?').bind(id).first<{ value: number }>()
    if ((count?.value ?? 0) <= 1) return NextResponse.json({ error: 'A project must keep at least one image.' }, { status: 400 })
    const current = await CMS_DB.prepare('SELECT object_key, sort_order FROM project_images WHERE id = ? AND project_id = ?')
      .bind(imageId, id).first<{ object_key: string; sort_order: number }>()
    if (!current) return NextResponse.json({ error: 'Project image not found.' }, { status: 404 })
    await CMS_DB.prepare('DELETE FROM project_images WHERE id = ? AND project_id = ?').bind(imageId, id).run()
    if (current.sort_order === 0) {
      const next = await CMS_DB.prepare('SELECT id, object_key, alt_text FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT 1')
        .bind(id).first<{ id: string; object_key: string; alt_text: string }>()
      if (next) {
        await CMS_DB.prepare('UPDATE project_images SET sort_order = 0 WHERE id = ?').bind(next.id).run()
        await CMS_DB.prepare('UPDATE content_items SET object_key = ?, alt_text = ? WHERE id = ?').bind(next.object_key, next.alt_text, id).run()
      }
    }
    await CMS_MEDIA.delete(current.object_key)
    return NextResponse.json({ ok: true })
  }
  if (action !== 'update') return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const subtitle = typeof body.subtitle === 'string' ? body.subtitle.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const industry = typeof body.industry === 'string' ? body.industry.trim().replace(/\s+/g, ' ') : ''
  const altText = typeof body.altText === 'string' ? body.altText.trim() : ''
  const published = body.published === true || body.published === 'true' ? 1 : 0
  const replacement = submittedForm?.get('image')
  if (!title || !industry || !altText) {
    return NextResponse.json({ error: 'Title, industry, and image description are required.' }, { status: 400 })
  }
  if (title.length > 120 || subtitle.length > 200 || description.length > 1500 || industry.length > 80 || altText.length > 300) {
    return NextResponse.json({ error: 'One or more fields exceed their maximum length.' }, { status: 400 })
  }

  const hasReplacement = replacement instanceof File && replacement.size > 0
  if (hasReplacement && (!CMS_MEDIA || !safeImageType(replacement) || replacement.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ error: 'Use PNG, JPG, WebP, or AVIF up to 10 MB.' }, { status: 400 })
  }

  let replacementKey = ''
  let previousKey = ''
  if (hasReplacement) {
    const fileBuffer = await replacement.arrayBuffer()
    if (!safeImageBytes(new Uint8Array(fileBuffer), replacement.type)) {
      return NextResponse.json({ error: 'The replacement is not a valid supported image.' }, { status: 400 })
    }
    const current = await CMS_DB.prepare('SELECT object_key FROM content_items WHERE id = ? AND type = ? AND archived = 0')
      .bind(id, 'project').first<{ object_key: string }>()
    if (!current) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    previousKey = current.object_key
    replacementKey = `projects/${id}-${crypto.randomUUID()}.${extensionFor(replacement)}`
    await CMS_MEDIA!.put(replacementKey, fileBuffer, {
      httpMetadata: { contentType: replacement.type, cacheControl: 'public, max-age=31536000, immutable' },
    })
  }

  try {
    if (replacementKey) {
      await CMS_DB.prepare(
        `UPDATE content_items
         SET title = ?, subtitle = ?, description = ?, industry = ?, alt_text = ?, published = ?, object_key = ?
         WHERE id = ? AND type = ? AND archived = 0`
      ).bind(title, subtitle, description, industry, altText, published, replacementKey, id, 'project').run()
      await CMS_DB.prepare('UPDATE project_images SET object_key = ?, alt_text = ? WHERE project_id = ? AND sort_order = 0')
        .bind(replacementKey, altText, id).run()
    } else {
      await CMS_DB.prepare(
        `UPDATE content_items
         SET title = ?, subtitle = ?, description = ?, industry = ?, alt_text = ?, published = ?
         WHERE id = ? AND type = ? AND archived = 0`
      ).bind(title, subtitle, description, industry, altText, published, id, 'project').run()
    }
  } catch (error) {
    if (replacementKey && CMS_MEDIA) await CMS_MEDIA.delete(replacementKey)
    throw error
  }
  if (replacementKey && previousKey && CMS_MEDIA) await CMS_MEDIA.delete(previousKey)
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { CMS_DB, CMS_MEDIA } = getCmsEnv()
  if (!CMS_DB || !CMS_MEDIA) {
    return NextResponse.json({ error: 'D1 or R2 is not configured.' }, { status: 503 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 51 * 1024 * 1024) {
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
  const files = form.getAll('image').filter((entry): entry is File => entry instanceof File && entry.size > 0)
  const file = files[0]

  if ((type !== 'partner' && type !== 'project') || !title || !altText || (type === 'project' && !industry) || !file) {
    return NextResponse.json({ error: 'Type, title, industry, alt text, and image are required for projects.' }, { status: 400 })
  }
  if ((type === 'partner' && files.length !== 1) || (type === 'project' && files.length > 5)) {
    return NextResponse.json({ error: 'Partners need one logo. Projects can start with up to five images.' }, { status: 400 })
  }
  if (title.length > 120 || subtitle.length > 200 || description.length > 1500 || industry.length > 80 || altText.length > 300) {
    return NextResponse.json(
      { error: 'Title must be 120 characters or fewer, subtitle 200, project description 1,500, and image description 300.' },
      { status: 400 }
    )
  }
  if (files.some((selectedFile) => !safeImageType(selectedFile) || selectedFile.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ error: 'Use PNG, JPG, WebP, or AVIF images up to 10 MB each.' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const uploadedImages: Array<{ id: string; objectKey: string }> = []
  for (let index = 0; index < files.length; index += 1) {
    const selectedFile = files[index]
    const fileBuffer = await selectedFile.arrayBuffer()
    if (!safeImageBytes(new Uint8Array(fileBuffer), selectedFile.type)) {
      for (const uploaded of uploadedImages) await CMS_MEDIA.delete(uploaded.objectKey)
      return NextResponse.json({ error: 'One of the uploaded files is not a valid supported image.' }, { status: 400 })
    }
    const imageId = index === 0 ? `${id}-primary` : crypto.randomUUID()
    const objectKey = index === 0
      ? `${type === 'partner' ? 'partners' : 'projects'}/${id}.${extensionFor(selectedFile)}`
      : `projects/${id}/${imageId}.${extensionFor(selectedFile)}`
    await CMS_MEDIA.put(objectKey, fileBuffer, {
      httpMetadata: { contentType: selectedFile.type, cacheControl: 'public, max-age=31536000, immutable' },
    })
    uploadedImages.push({ id: imageId, objectKey })
  }
  const objectKey = uploadedImages[0].objectKey
  const nextOrder = await CMS_DB.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS value FROM content_items WHERE type = ?'
  ).bind(type).first<{ value: number }>()
  const sortOrder = nextOrder?.value ?? 1

  try {
    await CMS_DB.prepare(
      `INSERT INTO content_items
       (id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, type, title, subtitle, description, industry, altText, objectKey, sortOrder, published).run()
    if (type === 'project') {
      for (let index = 0; index < uploadedImages.length; index += 1) {
        const uploaded = uploadedImages[index]
        await CMS_DB.prepare(
          `INSERT INTO project_images (id, project_id, object_key, alt_text, sort_order)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(uploaded.id, id, uploaded.objectKey, altText, index).run()
      }
    }
  } catch (error) {
    await CMS_DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run()
    for (const uploaded of uploadedImages) await CMS_MEDIA.delete(uploaded.objectKey)
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
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
  }

  const item = await CMS_DB.prepare('SELECT object_key, type, archived FROM content_items WHERE id = ?')
    .bind(id).first<{ object_key: string; type: 'partner' | 'project'; archived: number }>()
  if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (item.type === 'project' && !item.archived) {
    return NextResponse.json({ error: 'Archive this project before deleting it permanently.' }, { status: 409 })
  }

  const projectImages = item.type === 'project'
    ? await CMS_DB.prepare('SELECT object_key FROM project_images WHERE project_id = ?').bind(id).all<{ object_key: string }>()
    : { results: [{ object_key: item.object_key }], success: true }
  await CMS_DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run()
  for (const image of projectImages.results ?? []) await CMS_MEDIA.delete(image.object_key)
  return NextResponse.json({ ok: true })
}
