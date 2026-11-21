import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { ProjectsArchive } from '@/components/ProjectsArchive'
import { getSiteProjects } from '@/lib/site-projects'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Work',
  description: 'Selected Picarview projects across brand identity, campaigns, art direction and image-making.',
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: 'Our Work | Picarview',
    description: 'Selected Picarview projects across brand identity, campaigns, art direction and image-making.',
    url: '/projects',
    type: 'website',
  },
}

export default async function ProjectsPage() {
  const projects = await getSiteProjects()
  return (
    <>
      <Navbar />
      <ProjectsArchive projects={projects} />
    </>
  )
}
