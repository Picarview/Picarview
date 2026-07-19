import type { Metadata } from 'next'
import projectImages from '@/generated/project-images.json'
import { ProjectsArchive } from '@/components/ProjectsArchive'

export const metadata: Metadata = {
  title: 'Projects | Picarview',
  description: 'Explore the complete Picarview archive of visual design, campaigns, and image-making.',
}

export default function ProjectsPage() {
  return <ProjectsArchive fallbackImages={projectImages} />
}
