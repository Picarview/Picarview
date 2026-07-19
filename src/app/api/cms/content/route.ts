import { NextResponse } from 'next/server'
import { getCmsEnv, publicCmsItem, type CmsItem } from '@/lib/cloudflare-cms'

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
      `SELECT id, type, title, subtitle, alt_text, object_key, sort_order, published, created_at
       FROM content_items
       WHERE type = ? AND published = 1
       ORDER BY sort_order ASC, created_at DESC`
    ).bind(type).all<CmsItem>()

    return NextResponse.json({
      items: (query.results ?? []).map(publicCmsItem),
      configured: true,
    })
  } catch (error) {
    console.error('CMS public query failed', error)
    return NextResponse.json({ items: [], configured: false }, { status: 200 })
  }
}
