import { NextResponse } from 'next/server'
import { listPublishedContent } from '@/lib/cms-content'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get('type')
  if (type !== 'partner' && type !== 'project') {
    return NextResponse.json({ error: 'Invalid content type.' }, { status: 400 })
  }

  try {
    const items = await listPublishedContent(type)
    if (!items) return NextResponse.json({ items: [], configured: false })
    return NextResponse.json({ items, configured: true })
  } catch (error) {
    console.error('CMS public query failed', error)
    return NextResponse.json({ items: [], configured: false }, { status: 200 })
  }
}
