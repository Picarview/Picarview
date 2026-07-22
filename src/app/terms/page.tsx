import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Terms & Conditions', alternates: { canonical: '/terms' } }

export default function TermsPage() { return <LegalPage slug="terms" /> }
