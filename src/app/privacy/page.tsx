import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } }

export default function PrivacyPage() { return <LegalPage slug="privacy" /> }
