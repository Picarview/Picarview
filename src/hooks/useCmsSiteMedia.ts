'use client'

import { useEffect, useState } from 'react'

export type CmsSiteMediaSlot = 'hero' | 'expression-1' | 'expression-2' | 'expression-3' | 'expression-4'

export interface PublicCmsSiteMedia {
  slot: CmsSiteMediaSlot
  mediaType: 'image' | 'video'
  title: string
  altText: string
  mediaUrl: string
  updatedAt: string
}

export function useCmsSiteMedia() {
  const [items, setItems] = useState<PublicCmsSiteMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/cms/site-media', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return { items: [] }
        const data: unknown = await response.json()
        return typeof data === 'object' && data !== null
          ? data as { items?: PublicCmsSiteMedia[] }
          : { items: [] }
      })
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') console.error('CMS site media load failed', error)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return { items, loading }
}
