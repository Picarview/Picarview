import { NextResponse } from 'next/server'
import {
  getCmsEnv,
  isSameOrigin,
  readCookie,
  SESSION_COOKIE,
  verifyAdminSession,
  type CmsLegalPage,
} from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

interface LegalSection { heading: string; body: string }

async function authorized(request: Request) {
  const env = getCmsEnv()
  return verifyAdminSession(readCookie(request, SESSION_COOKIE), env.ADMIN_SESSION_SECRET)
}

function serialize(page: CmsLegalPage) {
  let sections: LegalSection[] = []
  try {
    const parsed: unknown = JSON.parse(page.sections_json)
    if (Array.isArray(parsed)) sections = parsed as LegalSection[]
  } catch { /* Invalid historical content safely becomes an empty document. */ }
  return {
    slug: page.slug,
    title: page.title,
    introduction: page.introduction,
    sections,
    effectiveDate: page.effective_date,
    published: Boolean(page.published),
    updatedAt: page.updated_at,
  }
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })
  const query = await CMS_DB.prepare(
    'SELECT slug, title, introduction, sections_json, effective_date, published, updated_at FROM legal_pages ORDER BY slug'
  ).all<CmsLegalPage>()
  return NextResponse.json({ pages: (query.results ?? []).map(serialize) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 })
  if (!await authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return NextResponse.json({ error: 'D1 is not configured.' }, { status: 503 })

  const body: unknown = await request.json()
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid document.' }, { status: 400 })
  const input = body as Record<string, unknown>
  const slug = input.slug
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const introduction = typeof input.introduction === 'string' ? input.introduction.trim() : ''
  const effectiveDate = typeof input.effectiveDate === 'string' ? input.effectiveDate.trim() : ''
  const published = input.published === true ? 1 : 0
  const sections = Array.isArray(input.sections) ? input.sections : []

  if ((slug !== 'privacy' && slug !== 'terms') || !title) {
    return NextResponse.json({ error: 'A valid page and title are required.' }, { status: 400 })
  }
  if (title.length > 100 || introduction.length > 1200 || effectiveDate.length > 40 || sections.length > 40) {
    return NextResponse.json({ error: 'The legal document exceeds the allowed length.' }, { status: 400 })
  }
  const cleanSections: LegalSection[] = []
  for (const section of sections) {
    if (!section || typeof section !== 'object') return NextResponse.json({ error: 'Invalid section.' }, { status: 400 })
    const record = section as Record<string, unknown>
    const heading = typeof record.heading === 'string' ? record.heading.trim() : ''
    const sectionBody = typeof record.body === 'string' ? record.body.trim() : ''
    if (!heading || !sectionBody || heading.length > 160 || sectionBody.length > 8000) {
      return NextResponse.json({ error: 'Every section needs a heading and body within the allowed length.' }, { status: 400 })
    }
    cleanSections.push({ heading, body: sectionBody })
  }

  await CMS_DB.prepare(
    `INSERT INTO legal_pages (slug, title, introduction, sections_json, effective_date, published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET title = excluded.title, introduction = excluded.introduction,
       sections_json = excluded.sections_json, effective_date = excluded.effective_date,
       published = excluded.published, updated_at = CURRENT_TIMESTAMP`
  ).bind(slug, title, introduction, JSON.stringify(cleanSections), effectiveDate, published).run()

  return NextResponse.json({ ok: true })
}
