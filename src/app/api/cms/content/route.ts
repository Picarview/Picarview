import { NextResponse } from 'next/server'
import { getCmsEnv, publicCmsItem, type CmsItem, type CmsProjectImage } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get('type')
  if (type !== 'partner' && type !== 'project') {
    return NextResponse.json({ error: 'Invalid content type.' }, { status: 400 })
  }

  try {
    const { CMS_DB } = getCmsEnv()
    if (!CMS_DB) return NextResponse.json({ items: [], configured: false })

    const query = await CMS_DB.prepare(
      `SELECT id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published, archived, pinned, created_at
       FROM content_items
       WHERE type = ? AND published = 1 AND archived = 0
       ORDER BY pinned DESC, sort_order ASC, created_at DESC`
    ).bind(type).all<CmsItem>()

    const imageQuery = type === 'project'
      ? await CMS_DB.prepare(
          `SELECT pi.id, pi.project_id, pi.object_key, pi.alt_text, pi.sort_order, pi.created_at
           FROM project_images pi
           INNER JOIN content_items ci ON ci.id = pi.project_id
           WHERE ci.type = 'project' AND ci.published = 1 AND ci.archived = 0
           ORDER BY pi.sort_order ASC, pi.created_at ASC`
        ).all<CmsProjectImage>()
      : { results: [] as CmsProjectImage[], success: true }
    const imagesByProject = new Map<string, Array<{ id: string; imageUrl: string; altText: string; sortOrder: number }>>()
    for (const image of imageQuery.results ?? []) {
      const images = imagesByProject.get(image.project_id) ?? []
      images.push({
        id: image.id,
        imageUrl: `/api/cms/media?key=${encodeURIComponent(image.object_key)}`,
        altText: image.alt_text,
        sortOrder: image.sort_order,
      })
      imagesByProject.set(image.project_id, images)
    }

    return NextResponse.json({
      items: (query.results ?? []).map((item) => ({
        ...publicCmsItem(item),
        images: imagesByProject.get(item.id) ?? [],
      })),
      configured: true,
    })
  } catch (error) {
    console.error('CMS public query failed', error)
    return NextResponse.json({ items: [], configured: false }, { status: 200 })
  }
}
