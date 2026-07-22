import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Terms & Conditions', alternates: { canonical: '/terms' } }

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const query = await searchParams
  return <LegalPage slug="terms" preview={query.preview === '1'} />
}
