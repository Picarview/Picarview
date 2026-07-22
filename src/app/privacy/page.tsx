import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } }

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const query = await searchParams
  return <LegalPage slug="privacy" preview={query.preview === '1'} />
}
