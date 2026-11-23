'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import type { Project } from '@/data/projects'
import { serviceTicker, servicePillars } from '@/data/services'
import { ProjectCard } from '@/components/ProjectDetail'
import { Partnerships } from '@/components/Partnerships'
import { SiteFooter } from '@/components/SiteFooter'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    title: 'Discover',
    body: 'We start by listening. Goals, audience, competitors and what success looks like, all agreed up front so everyone is pointed in the same direction.',
  },
  {
    title: 'Define',
    body: 'We turn what we learned into a clear creative direction: the idea, the tone and the few visual decisions that will carry everything else.',
  },
  {
    title: 'Create',
    body: 'Design, art direction, photography and production. Nothing from a template. Every piece is made for you and reviewed together along the way.',
  },
  {
    title: 'Launch',
    body: 'We hand over finished files and guidelines, help you roll the work out, and stay close afterwards to see what is working and refine it.',
  },
]

// Split the ticker words into staggered rows.
const tickerRows = [0, 1, 2, 3].map((row) => serviceTicker.filter((_, index) => index % 4 === row).concat(serviceTicker.slice(row * 2, row * 2 + 3)))

export function ServicesPage({ featured }: { featured: Project[] }) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.services-rise').forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%' },
        })
      })
      gsap.fromTo('.services-step', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.services-steps', start: 'top 82%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <main ref={rootRef} className="services">
      {/* Ticker band */}
      <section className="services-ticker" aria-label="Our services">
        <div className="hero-intro__gradient" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="services-ticker__rows" aria-hidden="true">
          {tickerRows.map((row, rowIndex) => (
            <div className={`services-ticker__row ${rowIndex % 2 ? 'is-reverse' : ''}`} key={rowIndex}>
              <div className="services-ticker__track">
                {[0, 1].map((copy) => (
                  <span className="services-ticker__group" key={copy}>
                    {row.map((word, wordIndex) => <span key={`${word}-${wordIndex}`}>{word}<i>•</i></span>)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="sr-only">{serviceTicker.join(', ')}</p>
      </section>

      {/* What we do */}
      <section className="services-intro">
        <div className="services-wrap">
          <h1 className="services-title services-rise">What we do</h1>
          <div className="services-intro__grid">
            <p className="services-intro__lead services-rise">
              Honestly? We make, know and do <em>a lot</em> of things.
            </p>
            <ul className="services-intro__list services-rise">
              <li>We&apos;ve built identities for restaurants, fashion labels, healthcare providers and non-profits.</li>
              <li>We&apos;ve art-directed campaigns, events and launches from the first idea to the final print.</li>
              <li>We&apos;ve shot the photography and video that bring those brands to life.</li>
              <li>And we sweat every detail along the way. So let&apos;s break it down.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="services-process">
        <div className="services-wrap">
          <h2 className="services-kicker services-rise">How we get things done</h2>
          <p className="services-process__lead services-rise">We make it <em>easy</em> for you.</p>
          <p className="services-process__intro services-rise">
            Whether it&apos;s a new identity, a campaign or a photoshoot, our process is simple and structured. Strategy,
            design and production work together on every project, so ideas never get lost between teams.
          </p>
          <ol className="services-steps">
            {steps.map((step, index) => (
              <li className="services-step" key={step.title} style={{ '--accent': servicePillars[index].accent } as CSSProperties}>
                <span className="services-step__number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Feature */}
      <section className="services-feature">
        <div className="services-wrap services-feature__grid">
          <div className="services-feature__copy services-rise">
            <h2 className="services-feature__title">Logos are just the beginning.</h2>
            <h3 className="services-kicker">Identity systems that work everywhere</h3>
            <p>
              A brand lives on signage, packaging, menus, social posts and the side of a delivery bag. We design
              identity systems, not just marks: colour, type, layout and imagery rules your team can actually use, with
              guidelines and templates that keep everything consistent long after we hand over.
            </p>
            <Link href="/projects" className="studio-link">See identity work <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="services-feature__stack services-rise" aria-hidden="true">
            {['/images/work10.webp', '/images/work6.webp', '/images/work11.webp'].map((src, index) => (
              <span key={src} style={{ '--i': index } as CSSProperties}>
                <Image src={src} alt="" fill sizes="(max-width: 760px) 60vw, 320px" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="services-capabilities">
        <div className="services-wrap">
          <h2 className="services-kicker services-rise">Our capabilities</h2>
          <div className="services-capabilities__grid">
            {servicePillars.map((pillar) => (
              <article className="services-capability services-rise" key={pillar.title} style={{ '--accent': pillar.accent } as CSSProperties}>
                <h3><span>{pillar.number}</span>{pillar.title}</h3>
                <p>{pillar.statement}</p>
                <ul>{pillar.offerings.map((offering) => <li key={offering}>{offering}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured work */}
      {featured.length > 0 && (
        <section className="services-featured">
          <div className="services-wrap">
            <div className="services-featured__head services-rise">
              <h2 className="services-kicker">Featured work</h2>
              <Link href="/projects" className="studio-link">All projects <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="case-related__grid">
              {featured.map((project) => <ProjectCard project={project} key={project.slug} />)}
            </div>
          </div>
        </section>
      )}

      <Partnerships />

      <section className="studio-next">
        <Link href="/about#the-team" className="studio-next__link">
          <span>Next</span>
          <strong>Meet the team <ArrowUpRight /></strong>
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
