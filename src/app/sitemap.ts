import type { MetadataRoute } from 'next'
import { getCmsEnv } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

const pages = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/projects', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = pages.map(({ path, priority, changeFrequency }) => ({
    url: `https://picarview.com${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
  try {
    const { CMS_DB } = getCmsEnv()
    if (!CMS_DB) return staticEntries
    const query = await CMS_DB.prepare(
      "SELECT slug, updated_at FROM legal_pages WHERE published = 1 AND slug NOT IN ('privacy', 'terms') ORDER BY title"
    ).all<{ slug: string; updated_at: string }>()
    return [...staticEntries, ...(query.results ?? []).map((page) => ({
      url: `https://picarview.com/legal/${page.slug}`,
      lastModified: new Date(`${page.updated_at}Z`),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    }))]
  } catch (error) {
    console.error('Legal sitemap query failed', error)
    return staticEntries
  }
}
