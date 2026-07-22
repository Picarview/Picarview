'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCmsItems } from '@/hooks/useCmsItems'

const accents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']
const disciplines = ['Identity', 'Campaign', 'Image-making', 'Art direction']

export function ProjectsArchive({ fallbackImages }: { fallbackImages: string[] }) {
  const cmsProjects = useCmsItems('project')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const projects = cmsProjects.length > 0
    ? cmsProjects
    : fallbackImages.map((imageUrl, index) => ({
        id: `fallback-${index + 1}`,
        imageUrl,
        title: `Picarview project ${index + 1}`,
        subtitle: disciplines[index % disciplines.length],
        description: 'A selected Picarview project shaped with purpose, clarity, and a visual direction designed to connect the idea with its audience.',
        altText: `Picarview project ${index + 1}`,
      }))

  useEffect(() => {
    if (activeIndex === null) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null)
      if (event.key === 'ArrowLeft') setActiveIndex((index) => index === null ? null : (index - 1 + projects.length) % projects.length)
      if (event.key === 'ArrowRight') setActiveIndex((index) => index === null ? null : (index + 1) % projects.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [activeIndex, projects.length])

  const activeProject = activeIndex === null ? null : projects[activeIndex]

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
          <button
            type="button"
            className="project-archive__card"
            style={{ backgroundColor: accents[index % accents.length] }}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${project.title}`}
            key={project.id}
          >
            <div className="project-archive__image">
              <Image src={project.imageUrl} alt={project.altText} fill unoptimized={project.imageUrl.startsWith('/api/')} sizes="(max-width: 560px) 45vw, (max-width: 900px) 44vw, 30vw" className="object-cover" />
            </div>
            <div className="project-archive__card-footer">
              <span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
              <strong>{project.subtitle || 'Selected work'}</strong>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </button>
        ))}
      </section>

      <footer className="project-archive__footer">
        <span>Picarview®</span><p>The archive grows with the practice.</p>
        <Link href="/contact">Start a project <ArrowUpRight className="h-4 w-4" /></Link>
      </footer>

      {activeProject && activeIndex !== null && (
        <div
          className="project-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeProject.title} project viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null)
          }}
        >
          <button className="project-viewer__close" onClick={() => setActiveIndex(null)} aria-label="Close project viewer">
            <X className="h-5 w-5" />
          </button>
          <button
            className="project-viewer__nav project-viewer__nav--previous"
            onClick={() => setActiveIndex((activeIndex - 1 + projects.length) % projects.length)}
            aria-label="Previous project"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <article className="project-viewer__card" style={{ '--viewer-accent': accents[activeIndex % accents.length] } as CSSProperties}>
            <div className="project-viewer__image">
              <Image
                src={activeProject.imageUrl}
                alt={activeProject.altText}
                fill
                priority
                unoptimized={activeProject.imageUrl.startsWith('/api/')}
                sizes="94vw"
                className="object-contain"
              />
            </div>
            <footer>
              <div><span>{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><h2>{activeProject.title}</h2></div>
              <strong>{activeProject.subtitle || 'Selected work'}</strong>
            </footer>
            <div className="project-viewer__description">
              <span>About the project</span>
              <p>
                {activeProject.description || 'A Picarview project shaped with purpose, clarity, and a visual direction designed to connect the idea with its audience.'}
              </p>
            </div>
          </article>
          <button
            className="project-viewer__nav project-viewer__nav--next"
            onClick={() => setActiveIndex((activeIndex + 1) % projects.length)}
            aria-label="Next project"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </main>
  )
}
