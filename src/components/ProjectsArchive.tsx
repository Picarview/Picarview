'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useCmsItems } from '@/hooks/useCmsItems'

const accents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']
const disciplines = ['Identity', 'Campaign', 'Image-making', 'Art direction']

export function ProjectsArchive({ fallbackImages }: { fallbackImages: string[] }) {
  const cmsProjects = useCmsItems('project')
  const projects = cmsProjects.length > 0
    ? cmsProjects
    : fallbackImages.map((imageUrl, index) => ({
        id: `fallback-${index + 1}`,
        imageUrl,
        title: `Picarview project ${index + 1}`,
        subtitle: disciplines[index % disciplines.length],
        altText: `Picarview project ${index + 1}`,
      }))

  return (
    <main className="project-archive">
      <div className="project-archive__aura" aria-hidden="true"><i /><i /></div>
      <header className="project-archive__header">
        <Link href="/#work" className="project-archive__back"><ArrowLeft className="h-4 w-4" />Back to Picarview</Link>
        <div className="project-archive__intro">
          <p>Project archive · {String(projects.length).padStart(2, '0')}</p>
          <h1>Every view.<br /><span>One archive.</span></h1>
          <div>
            <p>A growing collection of identities, campaigns, visual systems, and images created with intention.</p>
            <span>{projects.length} projects and counting</span>
          </div>
        </div>
      </header>

      <section className="project-archive__grid" aria-label="All Picarview projects">
        {projects.map((project, index) => (
          <article className="project-archive__card" style={{ backgroundColor: accents[index % accents.length] }} key={project.id}>
            <div className="project-archive__image">
              <Image src={project.imageUrl} alt={project.altText} fill unoptimized={project.imageUrl.startsWith('/api/')} sizes="(max-width: 560px) 88vw, (max-width: 900px) 44vw, 30vw" className="object-cover" />
            </div>
            <footer>
              <span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
              <strong>{project.subtitle || 'Selected work'}</strong>
              <ArrowUpRight className="h-4 w-4" />
            </footer>
          </article>
        ))}
      </section>

      <footer className="project-archive__footer">
        <span>Picarview®</span><p>The archive grows with the practice.</p>
        <Link href="/contact">Start a project <ArrowUpRight className="h-4 w-4" /></Link>
      </footer>
    </main>
  )
}
