'use client'

import { useEffect, useState } from 'react'

export interface PublicLegalPage { slug: string; title: string; href: string }

export function useLegalPages() {
  const [pages, setPages] = useState<PublicLegalPage[]>([])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/cms/legal', { signal: controller.signal })
      .then(async (response): Promise<{ pages?: PublicLegalPage[] }> => {
        if (!response.ok) return { pages: [] }
        const data: unknown = await response.json()
        return typeof data === 'object' && data !== null ? data as { pages?: PublicLegalPage[] } : { pages: [] }
      })
      .then((data) => setPages(Array.isArray(data.pages) ? data.pages : []))
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') console.error('Legal links load failed', error) })
    return () => controller.abort()
  }, [])
  return pages
}
