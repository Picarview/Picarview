'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLenis } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { principles, team as placeholderTeam, type TeamMember } from '@/data/team'
import { useCmsTeam } from '@/hooks/useCmsTeam'
import { Partnerships } from '@/components/Partnerships'
import { SiteFooter } from '@/components/SiteFooter'

gsap.registerPlugin(ScrollTrigger)

// Section order mirrors the reference page: About, The Team, Careers, Values.
const sections = [
  { id: 'about', label: 'About' },
  { id: 'the-team', label: 'The Team' },
  { id: 'careers', label: 'Careers' },
  { id: 'values', label: 'Values' },
]

// Our own work, used for the join band (no stock or invented photography).
const wall = ['/images/work1.webp', '/images/img3.webp', '/images/work3.webp', '/images/img1.webp', '/images/img4.webp', '/images/work4.webp']

export function StudioPage() {
  const rootRef = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const [active, setActive] = useState('about')
  const { members } = useCmsTeam()
  // CMS team members (Admin → Team) replace the role placeholders once any are published.
  const team: TeamMember[] = members.length
    ? members.map((member, index) => ({
        name: member.name,
        role: member.role,
        photo: member.photoUrl || undefined,
        initial: member.name.trim().charAt(0).toUpperCase() || '•',
        accent: placeholderTeam[index % placeholderTeam.length].accent,
      }))
    : placeholderTeam

  // Highlight the section currently in view in the side menu.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id) }),
      { rootMargin: '-40% 0px -55% 0px' }
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
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // The team grid animates separately so it re-runs when CMS members arrive.
  const teamKey = team.map((member) => member.name).join('|')
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.team-card', { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.team-grid', start: 'top 85%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [teamKey])

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
          {/* 1. About */}
          <section id="about" className="studio-about">
            <p className="studio-about__lead studio-rise">
              We are an independent creative practice that uses identity, image-making and story to help brands be
              seen, felt and remembered.
            </p>

            <div className="studio-split">
              <p className="studio-pull studio-rise">
                We are a multidisciplinary studio creating identities and images that live across every medium.
              </p>
              <div className="studio-split__copy studio-rise">
                <p>
                  At our core, we make things people can see and hold: identities, campaigns, posters, packaging and
                  imagery. We move past mood boards into execution and production, carrying every idea through to the
                  finished piece, from a single logo to a full launch campaign.
                </p>
                <p>
                  Our skill set is broad. Strategists, designers, art directors and image-makers work side by side on
                  every project, so the thinking and the making never drift apart and the work always sounds like you.
                </p>
              </div>
            </div>

            {/* 2. Let's get to the point */}
            <div className="studio-principles">
              <h2 className="studio-kicker studio-rise">Let&apos;s get to the point</h2>
              {principles.map((principle) => (
                <article className="studio-principle studio-rise" key={principle.title}>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              ))}
            </div>

            {/* 3. Partners, not clients */}
            <div className="studio-belief studio-rise">
              <h2 className="studio-kicker">&ldquo;Client&rdquo; is a word we avoid</h2>
              <p className="studio-belief__lead">Your wins are <em>our</em> wins.</p>
              <div className="studio-belief__copy">
                <p>
                  We see every engagement as a collaboration, much closer to a partnership than the usual
                  &ldquo;client and supplier&rdquo; arrangement.
                </p>
                <p>
                  Long-term relationships are where our best work comes from: brave ideas, careful craft and results we
                  are both proud to put our names to.
                </p>
                <p>
                  We focus on the right strategy for telling your story and building the most authentic brand
                  experience, and we stay open about how we get there at every step.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 4. Partnerships */}
      <div id="partnerships" className="studio-partners">
        <Partnerships />
      </div>

      {/* 5. The team */}
      <div className="studio-layout studio-layout--team">
        <div aria-hidden="true" />
        <section id="the-team" className="studio-team">
          <h2 className="studio-section-title studio-rise">The team</h2>
          <ul className="team-grid">
            {team.map((member) => (
              <li className="team-card" key={`${member.name}-${member.role}`} style={{ '--accent': member.accent } as CSSProperties}>
                <div className="team-card__photo">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} fill sizes="(max-width: 760px) 80vw, 300px" unoptimized={member.photo.startsWith('/api/')} />
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

      {/* 6. Join our team */}
      <section className="studio-join" aria-label="Join our team">
        <div className="studio-join__wall" aria-hidden="true">
          {wall.map((src) => (
            <span key={src}><Image src={src} alt="" fill sizes="(max-width: 760px) 50vw, 33vw" /></span>
          ))}
        </div>
        <a href="#careers" onClick={jump('careers')} className="studio-join__title">Join our team!</a>
      </section>

      {/* 7. Careers */}
      <section id="careers" className="studio-culture">
        <div className="studio-culture__inner">
          <h2 className="studio-culture__title studio-rise">Our crew is our <em>secret ingredient</em></h2>
          <div className="studio-split">
            <p className="studio-pull studio-rise">Different perspectives are at the heart of our creative work.</p>
            <div className="studio-split__copy studio-rise">
              <p>
                We build a collaborative studio where every voice is heard: designers next to strategists,
                photographers next to writers. That mix of backgrounds and experiences keeps our ideas fresh, our
                questions sharp and our work honest.
              </p>
              <p className="studio-culture__lead">We are always looking for new talent.</p>
              <p>
                If you are a designer, art director, photographer, videographer, strategist, producer or simply a
                talented person who cares about craft, send your portfolio to{' '}
                <a href="mailto:create@picarview.com?subject=Joining%20Picarview">create@picarview.com</a> and tell us
                what you love making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Values */}
      <section id="values" className="studio-values">
        <div className="studio-values__inner">
          <h2 className="studio-section-title studio-rise">Values</h2>
          <div className="studio-values__copy studio-rise">
            <p className="studio-values__lead">
              At Picarview, we are committed to an open, inclusive studio where different people do their best work.
            </p>
            <p>
              The range of identities and experiences on our team helps us make work that is thoughtful, informed and
              respectful of the people it is for.
            </p>
            <p>
              We believe in creative solutions that put accessibility, fairness and empathy first, in who we invite to
              the table, in the voices we amplify and in the work we put into the world.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Promo */}
      <section className="studio-promo">
        <div className="studio-promo__inner">
          <h2 className="studio-promo__title">
            Not sure where to start?
            <em>Start with a discovery session.</em>
          </h2>
          <p className="studio-promo__lead">Introducing Creative Discovery Workshops: a focused way to begin working with Picarview.</p>
          <p>A short, structured session where we research your brand and audience together and leave you with a clear creative direction, tailored to you.</p>
          <Link href="/contact" className="studio-link">Book a session <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
