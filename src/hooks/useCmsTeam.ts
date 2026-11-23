'use client'

import { useEffect, useState } from 'react'

export interface PublicTeamMember {
  id: string
  name: string
  role: string
  altText: string
  sortOrder: number
  photoUrl: string
}

/** Published team members from the CMS. `loaded` stays false until the request settles. */
export function useCmsTeam() {
  const [members, setMembers] = useState<PublicTeamMember[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/cms/team', { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() as Promise<{ members?: PublicTeamMember[] }> : { members: [] }))
      .then((data) => setMembers(Array.isArray(data.members) ? data.members : []))
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') console.error('CMS team load failed', error) })
      .finally(() => setLoaded(true))
    return () => controller.abort()
  }, [])

  return { members, loaded }
}
