import type { Metadata } from 'next'
import projectImages from '@/generated/project-images.json'
import { ProjectsArchive } from '@/components/ProjectsArchive'

export const metadata: Metadata = {
  title: 'Selected Projects',
  description: 'Explore the complete Picarview archive of visual design, campaigns, and image-making.',
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: 'Selected Projects | Picarview',
    description: 'Explore Picarview projects across visual design, campaigns, brand expression, and image-making.',
    url: '/projects',
    type: 'website',
  },
}

export default function ProjectsPage() {
  return <ProjectsArchive fallbackImages={projectImages} />
}
