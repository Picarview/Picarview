'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCmsItems } from '@/hooks/useCmsItems'

const accents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']
const disciplines = ['Identity', 'Campaign', 'Image-making', 'Art direction']

export function ProjectsArchive({ fallbackImages }: { fallbackImages: string[] }) {
  const lenis = useLenis()
  const cmsProjects = useCmsItems('project')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [industry, setIndustry] = useState('All')
  const projects = cmsProjects.length > 0
    ? cmsProjects
    : fallbackImages.map((imageUrl, index) => ({
        id: `fallback-${index + 1}`,
        imageUrl,
        images: [{ id: `fallback-image-${index + 1}`, imageUrl, altText: `Picarview project ${index + 1}`, sortOrder: 0 }],
        title: `Picarview project ${index + 1}`,
        subtitle: disciplines[index % disciplines.length],
        description: 'A selected Picarview project shaped with purpose, clarity, and a visual direction designed to connect the idea with its audience.',
        industry: disciplines[index % disciplines.length],
        altText: `Picarview project ${index + 1}`,
      }))
  const industries = useMemo(() => ['All', ...new Set(projects.map((project) => project.industry || 'General'))], [projects])
  const visibleProjects = industry === 'All' ? projects : projects.filter((project) => (project.industry || 'General') === industry)

  useEffect(() => { setActiveIndex(null); setActiveImageIndex(0) }, [industry])
  useEffect(() => { setActiveImageIndex(0) }, [activeIndex])

  useEffect(() => {
    if (activeIndex === null) return
    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width
    lenis?.stop()
    document.body.classList.add('project-viewer-open')
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null)
      if (event.key === 'ArrowLeft') setActiveIndex((index) => index === null ? null : (index - 1 + visibleProjects.length) % visibleProjects.length)
      if (event.key === 'ArrowRight') setActiveIndex((index) => index === null ? null : (index + 1) % visibleProjects.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.classList.remove('project-viewer-open')
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, scrollY)
      lenis?.start()
      window.removeEventListener('keydown', handleKey)
    }
  }, [activeIndex, lenis, visibleProjects.length])

  const activeProject = activeIndex === null ? null : visibleProjects[activeIndex]
  const activeProjectImages = activeProject?.images?.length ? activeProject.images : activeProject ? [{ id: `${activeProject.id}-cover`, imageUrl: activeProject.imageUrl, altText: activeProject.altText, sortOrder: 0 }] : []
  const activeProjectImage = activeProjectImages[activeImageIndex] ?? activeProjectImages[0]

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

      <nav className="project-archive__filters" aria-label="Filter projects by industry">
        <span>Filter by industry</span>
        <label>
          <span className="sr-only">Choose an industry</span>
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {industries.map((name) => <option value={name} key={name}>{name} ({name === 'All' ? projects.length : projects.filter((project) => (project.industry || 'General') === name).length})</option>)}
          </select>
        </label>
        <div>
          {industries.map((name) => (
            <button type="button" className={industry === name ? 'is-active' : ''} onClick={() => setIndustry(name)} aria-pressed={industry === name} key={name}>
              {name}<i>{name === 'All' ? projects.length : projects.filter((project) => (project.industry || 'General') === name).length}</i>
            </button>
          ))}
        </div>
      </nav>

      <section className="project-archive__grid" aria-label="All Picarview projects">
        {visibleProjects.map((project, index) => (
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
              <span>{String(index + 1).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}</span>
              <strong>{project.industry || 'General'}</strong>
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
            onClick={() => setActiveIndex((activeIndex - 1 + visibleProjects.length) % visibleProjects.length)}
            aria-label="Previous project"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <article
            className="project-viewer__card"
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
            style={{ '--viewer-accent': accents[activeIndex % accents.length] } as CSSProperties}
          >
            <div className="project-viewer__image">
              <Image
                src={activeProjectImage.imageUrl}
                alt={activeProjectImage.altText || activeProject.altText}
                fill
                priority
                unoptimized={activeProjectImage.imageUrl.startsWith('/api/')}
                sizes="94vw"
                className="object-contain"
              />
            </div>
            <footer>
              <div><span>{String(activeIndex + 1).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}</span><h2>{activeProject.title}</h2></div>
              <strong>{activeProject.industry || 'General'}</strong>
            </footer>
            <div className="project-viewer__description">
              <span>About the project</span>
              <p>
                {activeProject.description || 'A Picarview project shaped with purpose, clarity, and a visual direction designed to connect the idea with its audience.'}
              </p>
              {activeProjectImages.length > 1 && (
                <div className="project-viewer__gallery" aria-label="Project image gallery">
                  {activeProjectImages.map((projectImage, imageIndex) => (
                    <button type="button" className={activeImageIndex === imageIndex ? 'is-active' : ''} onClick={() => setActiveImageIndex(imageIndex)} aria-label={`Show project image ${imageIndex + 1}`} key={projectImage.id}>
                      <Image src={projectImage.imageUrl} alt="" fill sizes="90px" className="object-cover" unoptimized={projectImage.imageUrl.startsWith('/api/')} />
                      <span>{String(imageIndex + 1).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
          <button
            className="project-viewer__nav project-viewer__nav--next"
            onClick={() => setActiveIndex((activeIndex + 1) % visibleProjects.length)}
            aria-label="Next project"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </main>
  )
}
