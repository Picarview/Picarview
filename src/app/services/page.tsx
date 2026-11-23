import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { ServicesPage } from '@/components/ServicesPage'
import { getSiteProjects } from '@/lib/site-projects'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Services',
  description: 'What Picarview does: brand identity, creative strategy, art direction, campaigns, photography and videography. How we work and what we offer.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services | Picarview',
    description: 'Brand identity, creative strategy, art direction, campaigns, photography and videography.',
    url: '/services',
    type: 'website',
  },
}

export default async function Services() {
  const projects = await getSiteProjects()
  return (
    <>
      <Navbar />
      <ServicesPage featured={projects.slice(0, 3)} />
    </>
  )
}
