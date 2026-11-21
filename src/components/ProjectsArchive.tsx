'use client'

import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, LayoutGrid, List } from 'lucide-react'
import type { Project } from '@/data/projects'
import { SiteFooter } from '@/components/SiteFooter'
import { ProjectCard } from '@/components/ProjectDetail'

type View = 'grid' | 'list'

export function ProjectsArchive({ projects }: { projects: Project[] }) {
  const [industry, setIndustry] = useState('All')
  const [view, setView] = useState<View>('grid')
  const [preview, setPreview] = useState<Project | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const industries = useMemo(() => {
    const counts = new Map<string, number>()
    projects.forEach((project) => counts.set(project.industry, (counts.get(project.industry) ?? 0) + 1))
    return [['All', projects.length] as const, ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))]
  }, [projects])

  const visible = industry === 'All' ? projects : projects.filter((project) => project.industry === industry)

  // The list view's floating preview follows the pointer without re-rendering.
  const movePreview = (event: MouseEvent) => {
    const node = previewRef.current
    if (!node) return
    node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`
  }

  return (
    <main className="work-index">
      <header className="work-index__header">
        <p className="work-index__eyebrow">
          <span>Our work</span>
          <span>({String(projects.length).padStart(2, '0')})</span>
        </p>
        <h1 className="work-index__title">
          Selected <em>work</em>
        </h1>
        <div className="work-index__intro">
          <p>
            Identities, campaigns and image-making for brands that want to be <em>seen</em> — and remembered.
          </p>
          <Link href="/contact" className="work-index__intro-link">
            Start a project <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="work-index__toolbar">
        <nav className="work-index__filters" aria-label="Filter projects by industry">
          <span className="work-index__filters-label">Filter by industry</span>
          <div className="work-index__chips">
            {industries.map(([name, count]) => (
              <button
                type="button"
                key={name}
                className={industry === name ? 'is-active' : ''}
                aria-pressed={industry === name}
                onClick={() => setIndustry(name)}
              >
                {name}<sup>{count}</sup>
              </button>
            ))}
          </div>
          <label className="work-index__select">
            <span className="sr-only">Choose an industry</span>
            <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              {industries.map(([name, count]) => <option value={name} key={name}>{name} ({count})</option>)}
            </select>
          </label>
        </nav>
        <div className="work-index__views" role="group" aria-label="Layout">
          <button type="button" className={view === 'grid' ? 'is-active' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
            <LayoutGrid className="h-4 w-4" /><span>Grid</span>
          </button>
          <button type="button" className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List className="h-4 w-4" /><span>Index</span>
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="work-index__wrap">
          {industry === 'All' && visible.length > 2 && (
            <section className="work-featured" aria-label="Featured projects">
              {visible.slice(0, 2).map((project) => <ProjectCard project={project} feature priority key={project.slug} />)}
            </section>
          )}
          <section className="work-grid" aria-label="Projects">
            {(industry === 'All' && visible.length > 2 ? visible.slice(2) : visible).map((project, index) => (
              <ProjectCard project={project} priority={index < 3} key={project.slug} />
            ))}
          </section>
        </div>
      ) : (
        <section className="work-list" aria-label="Projects" onMouseMove={movePreview} onMouseLeave={() => setPreview(null)}>
          <div className="work-list__head" aria-hidden="true">
            <span>No.</span><span>Project</span><span>Industry</span><span>Services</span><span>Year</span>
          </div>
          {visible.map((project, index) => (
            <Link
              href={`/projects/${project.slug}`}
              className="work-list__row"
              style={{ '--accent': project.accent } as CSSProperties}
              onMouseEnter={() => setPreview(project)}
              onFocus={() => setPreview(project)}
              key={project.slug}
            >
              <span className="work-list__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="work-list__title">{project.title}<em>{project.client}</em></span>
              <span className="work-list__industry">{project.industry}</span>
              <span className="work-list__services">{project.services.slice(0, 2).join(', ')}</span>
              <span className="work-list__year">{project.year}<ArrowUpRight className="h-4 w-4" /></span>
            </Link>
          ))}
          <div
            ref={previewRef}
            className={`work-list__preview ${preview ? 'is-visible' : ''}`}
            style={{ '--surface': preview?.surface ?? '#111' } as CSSProperties}
            aria-hidden="true"
          >
            {visible.map((project) => (
              <Image
                key={project.slug}
                src={project.cover}
                alt=""
                fill
                sizes="320px"
                unoptimized={project.cover.startsWith('/api/')}
                className={`${preview?.slug === project.slug ? 'is-active' : ''} work-list__preview-img--${project.coverFit}`}
              />
            ))}
          </div>
        </section>
      )}

      {visible.length === 0 && <p className="work-index__empty">No projects in this industry yet.</p>}

      <SiteFooter />
    </main>
  )
}
