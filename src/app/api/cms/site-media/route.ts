import { NextResponse } from 'next/server'
import { getCmsEnv, type CmsSiteMedia } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { CMS_DB } = getCmsEnv()
    if (!CMS_DB) return NextResponse.json({ items: [] })
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
  } catch (error) {
    console.error('CMS site media query failed', error)
    return NextResponse.json({ items: [] })
  }
}
