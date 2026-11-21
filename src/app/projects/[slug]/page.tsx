import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ProjectDetail } from '@/components/ProjectDetail'
import { getNextProject, getRelatedProjects } from '@/data/projects'
import { getSiteProjects } from '@/lib/site-projects'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function findProject(slug: string) {
  const projects = await getSiteProjects()
  const index = projects.findIndex((project) => project.slug === slug)
  return { projects, index, project: index >= 0 ? projects[index] : undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { project } = await findProject(slug)
  if (!project) return { title: 'Project not found' }
  const description = `${project.tagline} ${project.overview}`.slice(0, 158)
  return {
    title: `${project.title} — ${project.industry}`,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} | Picarview`,
      description,
      url: `/projects/${project.slug}`,
      type: 'article',
      images: project.cover.startsWith('/api/') ? undefined : [{ url: project.cover, alt: project.coverAlt }],
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const { projects, index, project } = await findProject(slug)
  if (!project) notFound()

  return (
    <>
      <Navbar />
      <ProjectDetail
        project={project}
        index={index}
        total={projects.length}
        next={getNextProject(project, projects)}
        related={getRelatedProjects(project, projects)}
      />
    </>
  )
}
