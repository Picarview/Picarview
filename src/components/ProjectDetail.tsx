'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { Project, ProjectFrame } from '@/data/projects'
import { SiteFooter } from '@/components/SiteFooter'

gsap.registerPlugin(ScrollTrigger)

interface ProjectDetailProps {
  project: Project
  index: number
  total: number
  next: Project
  related: Project[]
}

const isRemote = (src: string) => src.startsWith('/api/')

/** Perceived brightness check so swatch labels stay readable on light colours. */
function isLightColor(hex: string) {
  const value = hex.replace('#', '')
  if (value.length !== 6) return false
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

/**
 * Shows an image whole (no cropping) over a blurred, cover-sized copy of itself,
 * so images of any proportion sit nicely in a fixed frame. Same URL, so the file
 * is only downloaded once.
 */
export function FitImage({ src, alt, sizes, priority = false }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <>
      <Image src={src} alt="" aria-hidden fill sizes={sizes} className="fit-media__fill" unoptimized={isRemote(src)} />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="fit-media__main" unoptimized={isRemote(src)} />
    </>
  )
}

/** Renders a project's cover in whichever mode suits it. */
function Cover({ project, sizes, priority = false, decorative = false }: { project: Project; sizes: string; priority?: boolean; decorative?: boolean }) {
  const alt = decorative ? '' : project.coverAlt
  if (project.coverFit === 'fit') return <FitImage src={project.cover} alt={alt} sizes={sizes} priority={priority} />
  return <Image src={project.cover} alt={alt} fill priority={priority} sizes={sizes} unoptimized={isRemote(project.cover)} />
}

// Frames render at most ~560px wide, so the 1100–1600px source files stay crisp on 2x screens.
const FRAME_SIZES = '(max-width: 760px) 92vw, 560px'

function Frame({ frame, project }: { frame: ProjectFrame; project: Project }) {
  if (frame.kind === 'mockup') {
    return (
      <figure className={`case-frame case-frame--mockup case-frame--${frame.variant}`}>
        <div className="case-frame__surface" style={{ backgroundColor: frame.tint }}>
          {frame.variant === 'card' && (
            <span className="case-frame__card-back" style={{ backgroundColor: frame.reverse ?? project.accent }} aria-hidden="true" />
          )}
          <span className="case-frame__piece" style={{ backgroundColor: project.surface }}>
            <Image src={frame.src} alt={frame.alt} fill sizes="(max-width: 760px) 60vw, 340px" unoptimized={isRemote(frame.src)} />
          </span>
        </div>
        {frame.caption && <figcaption>{frame.caption}</figcaption>}
      </figure>
    )
  }

  return (
    <figure className={`case-frame case-frame--${frame.kind}`}>
      <div className="case-frame__surface" style={{ backgroundColor: frame.kind === 'tint' ? frame.tint : project.surface }}>
        {frame.kind === 'image' && frame.fit
          ? <FitImage src={frame.src} alt={frame.alt} sizes={FRAME_SIZES} />
          : <Image src={frame.src} alt={frame.alt} fill sizes={FRAME_SIZES} unoptimized={isRemote(frame.src)} />}
      </div>
      {frame.caption && <figcaption>{frame.caption}</figcaption>}
    </figure>
  )
}

export function ProjectDetail({ project, index, total, next, related }: ProjectDetailProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [firstFrame, secondFrame, ...moreFrames] = project.frames

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .fromTo('.case-hero__reveal', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08 })
        .fromTo('.case-hero__fade', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.35)

      gsap.utils.toArray<HTMLElement>('.case-rise').forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 90%' },
        })
      })

      gsap.utils.toArray<HTMLElement>('.case-swatch').forEach((swatch, swatchIndex) => {
        gsap.fromTo(swatch, { scaleY: 0 }, {
          scaleY: 1, duration: 0.9, delay: swatchIndex * 0.08, ease: 'power3.out', transformOrigin: 'bottom',
          scrollTrigger: { trigger: '.case-palette', start: 'top 85%' },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [project.slug])

  return (
    <main ref={rootRef} className="case" style={{ '--accent': project.accent, '--surface': project.surface } as CSSProperties}>
      <header className="case-hero case-wrap">
        <div className="case-hero__top case-hero__fade">
          <Link href="/projects" className="case-hero__back"><ArrowLeft className="h-4 w-4" />All work</Link>
          <span>Project {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        </div>
        <p className="case-hero__client case-hero__fade">{project.client}</p>
        <h1 className="case-hero__title">
          <span className="case-hero__line"><span className="case-hero__reveal">{project.title}</span></span>
        </h1>
        <p className="case-hero__tagline">
          <span className="case-hero__line"><span className="case-hero__reveal">{project.tagline}</span></span>
        </p>
        {project.services.length > 0 && (
          <ul className="case-hero__tags case-hero__fade">
            {project.services.map((service) => <li key={service}>{service}</li>)}
          </ul>
        )}
      </header>

      {/* Cover on the left at a moderate size; facts and overview beside it. */}
      <section className="case-intro case-wrap">
        <div className={`case-cover case-cover--${project.coverFit} case-hero__fade`}>
          <Cover project={project} priority sizes="(max-width: 760px) 92vw, 520px" />
        </div>
        <div className="case-intro__text">
          <dl className="case-meta case-rise">
            <div><dt>Client</dt><dd>{project.client}</dd></div>
            <div><dt>Industry</dt><dd>{project.industry}</dd></div>
            {project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}
            {project.deliverables.length > 0 && <div><dt>Deliverables</dt><dd>{project.deliverables.join(', ')}</dd></div>}
          </dl>
          <div className="case-overview case-rise">
            <span className="case-label">Overview</span>
            <p>{project.overview}</p>
          </div>
        </div>
      </section>

      {/* Zigzag: text and frames alternate sides, like an editorial spread. */}
      <section className={`case-row case-wrap ${firstFrame ? '' : 'case-row--text'}`}>
        {firstFrame && <div className="case-row__media case-rise"><Frame frame={firstFrame} project={project} /></div>}
        <article className="case-row__text case-rise">
          <span className="case-label"><i>01</i>The challenge</span>
          <p>{project.challenge}</p>
        </article>
      </section>

      <section className={`case-row case-row--reverse case-wrap ${secondFrame ? '' : 'case-row--text'}`}>
        <article className="case-row__text case-rise">
          <span className="case-label"><i>02</i>Our approach</span>
          <p>{project.approach}</p>
        </article>
        {secondFrame && <div className="case-row__media case-rise"><Frame frame={secondFrame} project={project} /></div>}
      </section>

      <section className="case-palette case-wrap case-rise" aria-label="Colour palette">
        <div className="case-palette__intro">
          <span className="case-label">Palette</span>
          <p>The colours that carry {project.title}.</p>
        </div>
        <div className="case-palette__swatches">
          {project.palette.map((swatch) => (
            <div className={`case-swatch ${isLightColor(swatch.hex) ? 'case-swatch--light' : ''}`} style={{ backgroundColor: swatch.hex }} key={swatch.hex}>
              <span>{swatch.name}</span>
              <code>{swatch.hex}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="case-outcomes case-wrap">
        <span className="case-label case-rise"><i>03</i>The result</span>
        <div className="case-outcomes__grid">
          {project.outcomes.map((outcome, outcomeIndex) => (
            <article className="case-rise" key={outcome.title}>
              <span>{String(outcomeIndex + 1).padStart(2, '0')}</span>
              <h3>{outcome.title}</h3>
              <p>{outcome.body}</p>
            </article>
          ))}
        </div>
      </section>

      {moreFrames.length > 0 && (
        <div className="case-more case-wrap">
          {moreFrames.map((frame, frameIndex) => (
            <div className="case-rise" key={frameIndex}><Frame frame={frame} project={project} /></div>
          ))}
        </div>
      )}

      {project.quote && (
        <blockquote className="case-quote case-wrap case-rise">
          <p>“{project.quote.text}”</p>
          <cite>— {project.quote.author}</cite>
        </blockquote>
      )}

      {next.slug !== project.slug && (
        <Link
          href={`/projects/${next.slug}`}
          className="case-next"
          style={{ '--next-accent': next.accent, '--next-surface': next.surface } as CSSProperties}
        >
          <span className="case-next__inner case-wrap">
            <span className="case-next__label">Next project</span>
            <span className="case-next__title">{next.title}<ArrowUpRight className="case-next__arrow" /></span>
            <span className={`case-next__media case-next__media--${next.coverFit}`}>
              <Cover project={next} decorative sizes="(max-width: 760px) 50vw, 260px" />
            </span>
          </span>
        </Link>
      )}

      {related.length > 0 && (
        <section className="case-related case-wrap" aria-label="Related work">
          <div className="case-related__head">
            <span className="case-label">Related work</span>
            <Link href="/projects">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="case-related__grid">
            {related.map((item) => <ProjectCard project={item} key={item.slug} />)}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  )
}

/** CMYK-style card: image above, a white text card with tags, client, headline and link. */
export function ProjectCard({ project, priority = false, feature = false }: { project: Project; priority?: boolean; feature?: boolean }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`work-card ${feature ? 'work-card--feature' : ''}`}
      style={{ '--accent': project.accent, '--surface': project.surface } as CSSProperties}
    >
      <div className={`work-card__media work-card__media--${project.coverFit}`}>
        <Cover
          project={project}
          priority={priority}
          sizes={feature ? '(max-width: 760px) 92vw, 560px' : '(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 380px'}
        />
      </div>
      <div className="work-card__body">
        {project.services.length > 0 && (
          <ul className="work-card__tags">
            {project.services.slice(0, 3).map((service) => <li key={service}>{service}</li>)}
          </ul>
        )}
        <p className="work-card__client">{project.client}</p>
        <h2 className="work-card__title">{project.tagline}</h2>
        <span className="work-card__link">View project <i aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
