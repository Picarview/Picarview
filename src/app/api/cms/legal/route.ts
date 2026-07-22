import { NextResponse } from 'next/server'
import { getCmsEnv, type CmsLegalPage } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { CMS_DB } = getCmsEnv()
    if (!CMS_DB) return NextResponse.json({ pages: [] })
    const query = await CMS_DB.prepare(
      'SELECT slug, title, introduction, sections_json, effective_date, published, updated_at FROM legal_pages WHERE published = 1 ORDER BY title'
    ).all<CmsLegalPage>()
    return NextResponse.json({
      pages: (query.results ?? []).map((page) => ({
        slug: page.slug,
        title: page.title,
        href: page.slug === 'privacy' || page.slug === 'terms' ? `/${page.slug}` : `/legal/${page.slug}`,
      })),
    }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('Public legal pages query failed', error)
    return NextResponse.json({ pages: [] })
  }
}
