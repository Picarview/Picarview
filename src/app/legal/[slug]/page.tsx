import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalPage } from '@/components/LegalPage'

export const dynamic = 'force-dynamic'

interface PageProps { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), alternates: { canonical: `/legal/${slug}` } }
}

export default async function DynamicLegalPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound()
  const query = await searchParams
  return <LegalPage slug={slug} preview={query.preview === '1'} />
}
