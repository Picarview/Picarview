import { NextResponse } from 'next/server'
import { getCmsEnv, publicTeamMember, type CmsTeamMember } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

/** Published team members for the studio page. Empty when none exist yet. */
export async function GET() {
  try {
    const { CMS_DB } = getCmsEnv()
    if (!CMS_DB) return NextResponse.json({ members: [], configured: false })
    const query = await CMS_DB.prepare(
      `SELECT id, name, role, object_key, alt_text, sort_order, published, created_at
       FROM team_members WHERE published = 1 ORDER BY sort_order ASC, created_at ASC`
    ).all<CmsTeamMember>()
    return NextResponse.json({ members: (query.results ?? []).map(publicTeamMember), configured: true })
  } catch (error) {
    console.error('CMS team query failed', error)
    return NextResponse.json({ members: [], configured: false })
  }
}
