'use client'

import { useEffect, useState } from 'react'

export interface PublicCmsItem {
  id: string
  type: 'partner' | 'project'
  title: string
  subtitle: string
  description: string
  industry: string
  altText: string
  sortOrder: number
  imageUrl: string
  images: Array<{ id: string; imageUrl: string; altText: string; sortOrder: number }>
}

interface PublicCmsResponse {
  items?: PublicCmsItem[]
}

export function useCmsItems(type: 'partner' | 'project') {
  const [items, setItems] = useState<PublicCmsItem[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/cms/content?type=${type}`, { signal: controller.signal })
      .then(async (response): Promise<PublicCmsResponse> => {
        if (!response.ok) return { items: [] }
        const data: unknown = await response.json()
        return typeof data === 'object' && data !== null ? data as PublicCmsResponse : { items: [] }
      })
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') console.error('CMS content load failed', error)
      })
    return () => controller.abort()
  }, [type])

  return items
}
