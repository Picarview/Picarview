import type { MetadataRoute } from 'next'

const pages = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/projects', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `https://picarview.com${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
