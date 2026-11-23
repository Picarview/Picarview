'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLenis } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { principles, team } from '@/data/team'
import { Partnerships } from '@/components/Partnerships'
import { SiteFooter } from '@/components/SiteFooter'

gsap.registerPlugin(ScrollTrigger)

const sections = [
  { id: 'about', label: 'About' },
  { id: 'the-team', label: 'The Team' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'careers', label: 'Careers' },
]

// Our own work, used as a collage (no stock or invented photography).
const wall = ['/images/work1.webp', '/images/img3.webp', '/images/work3.webp', '/images/img1.webp', '/images/img4.webp', '/images/work4.webp']

export function StudioPage() {
  const rootRef = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const [active, setActive] = useState('about')

  // Highlight the section currently in view in the side menu.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    sections.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  // Honour /about#the-team links once Lenis is ready.
  useEffect(() => {
    if (!lenis || !window.location.hash) return
    const target = document.querySelector(window.location.hash)
    if (target) window.setTimeout(() => lenis.scrollTo(target as HTMLElement, { offset: -90, immediate: true }), 50)
  }, [lenis])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.studio-hero__reveal', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out' })
      gsap.utils.toArray<HTMLElement>('.studio-rise').forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%' },
        })
      })
      gsap.fromTo('.team-card', { opacity: 0, y: 50, rotate: (index: number) => [-3, 2, -1.5][index % 3] }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.team-grid', start: 'top 85%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const jump = (id: string) => (event: React.MouseEvent) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    if (lenis) lenis.scrollTo(target, { offset: -90 })
    else target.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <main ref={rootRef} className="studio">
      <header className="studio-hero">
        <h1 className="studio-hero__title">
          <span className="studio-hero__line"><span className="studio-hero__reveal">We are Picarview</span></span>
        </h1>
      </header>

      <div className="studio-layout">
        <nav className="studio-nav" aria-label="Page sections">
          <span>Sections</span>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} onClick={jump(section.id)} className={active === section.id ? 'is-active' : ''}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="studio-content">
          {/* About */}
          <section id="about" className="studio-about">
            <p className="studio-about__lead studio-rise">
              We are an independent creative practice that uses <em>identity</em>, <em>image-making</em> and{' '}
              <em>story</em> to help brands be seen and remembered.
            </p>
            <div className="studio-about__body">
              <div className="studio-wall studio-rise" aria-hidden="true">
                {wall.slice(0, 4).map((src, index) => (
                  <span key={src} style={{ '--i': index } as CSSProperties}>
                    <Image src={src} alt="" fill sizes="160px" />
                  </span>
                ))}
              </div>
              <div className="studio-about__copy studio-rise">
                <p>
                  At our core, we make things people can see and hold: identities, campaigns, posters, packaging and
                  imagery. We move past mood boards into execution, carrying every idea through to the finished piece.
                </p>
                <p>
                  Strategists, designers, art directors and image-makers work side by side on every project. That means
                  the thinking and the making never drift apart, and the work always sounds like you.
                </p>
              </div>
            </div>

            <div className="studio-principles">
              <h2 className="studio-kicker studio-rise">Let&apos;s get to the point</h2>
              {principles.map((principle, index) => (
                <article className="studio-principle studio-rise" key={principle.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>

            <div className="studio-belief studio-rise">
              <h2 className="studio-kicker">Partners, not clients</h2>
              <p className="studio-belief__lead">Your wins are <em>our</em> wins.</p>
              <p>
                We treat every engagement as a collaboration. We share the goal, we share the process openly, and we
                stay around after launch, because the best work comes from relationships, not transactions.
              </p>
            </div>
          </section>

          {/* Team */}
          <section id="the-team" className="studio-team">
            <h2 className="studio-section-title studio-rise">The team</h2>
            <ul className="team-grid">
              {team.map((member) => (
                <li className="team-card" key={member.role} style={{ '--accent': member.accent } as CSSProperties}>
                  <div className="team-card__photo">
                    {member.photo ? (
                      <Image src={member.photo} alt={member.name} fill sizes="(max-width: 760px) 80vw, 300px" />
                    ) : (
                      <span className="team-card__monogram" aria-hidden="true">
                        <i>[</i>{member.initial}<i>]</i>
                      </span>
                    )}
                  </div>
                  <div className="team-card__caption">
                    <h3>{member.placeholder ? member.role : member.name}</h3>
                    <p>{member.placeholder ? 'Profile coming soon' : member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div id="partnerships" className="studio-partners">
        <Partnerships />
      </div>

      {/* Join band */}
      <section id="careers" className="studio-join">
        <div className="studio-join__wall" aria-hidden="true">
          {wall.map((src) => (
            <span key={src}><Image src={src} alt="" fill sizes="(max-width: 760px) 50vw, 33vw" /></span>
          ))}
        </div>
        <a href="mailto:create@picarview.com?subject=Joining%20Picarview" className="studio-join__title">
          Join our team!
        </a>
      </section>

      <section className="studio-culture">
        <div className="studio-culture__inner">
          <h2 className="studio-culture__title studio-rise">Our crew is our <em>secret ingredient</em></h2>
          <div className="studio-culture__copy studio-rise">
            <p className="studio-culture__lead">Different backgrounds make braver work.</p>
            <p>
              We build a studio where every voice is heard: designers next to strategists, photographers next to
              writers. That mix of perspectives is what keeps our ideas fresh and our work honest.
            </p>
            <p className="studio-culture__lead">We are always looking for new talent.</p>
            <p>
              If you are a designer, art director, photographer, videographer, strategist or producer who cares about
              craft, we would love to see your work.
            </p>
            <a href="mailto:create@picarview.com?subject=Joining%20Picarview" className="studio-link">
              Send us your portfolio <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="studio-next">
        <Link href="/services" className="studio-next__link">
          <span>Next</span>
          <strong>What we do <ArrowUpRight /></strong>
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
