import { NextResponse } from 'next/server'
import { getCmsEnv, publicCmsItem, type CmsItem, type CmsProjectMedia } from '@/lib/cloudflare-cms'

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
      `SELECT id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published, created_at
       FROM content_items
       WHERE type = ? AND published = 1
       ORDER BY sort_order ASC, created_at DESC`
    ).bind(type).all<CmsItem>()

    const mediaQuery = type === 'project'
      ? await CMS_DB.prepare(
        `SELECT id, project_id, alt_text, object_key, sort_order, created_at
         FROM project_media ORDER BY project_id ASC, sort_order ASC, created_at ASC`
      ).all<CmsProjectMedia>()
      : { results: [] as CmsProjectMedia[], success: true }
    const mediaByProject = new Map<string, CmsProjectMedia[]>()
    for (const media of mediaQuery.results ?? []) {
      const projectMedia = mediaByProject.get(media.project_id) ?? []
      projectMedia.push(media)
      mediaByProject.set(media.project_id, projectMedia)
    }

    return NextResponse.json({
      items: (query.results ?? []).map((item) => publicCmsItem(item, mediaByProject.get(item.id))),
      configured: true,
    })
  } catch (error) {
    console.error('CMS public query failed', error)
    return NextResponse.json({ items: [], configured: false }, { status: 200 })
  }
}
