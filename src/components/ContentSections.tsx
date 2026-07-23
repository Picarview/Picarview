'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { useCmsItems } from '@/hooks/useCmsItems'
import { useCmsSiteMedia } from '@/hooks/useCmsSiteMedia'
import { useLegalPages } from '@/hooks/useLegalPages'

gsap.registerPlugin(ScrollTrigger)

// Soft Mask Reveal Hook for headings - preserves existing structure
function useSoftMaskReveal<T extends HTMLElement>(elementRef: React.RefObject<T | null>, splitByChar = false) {
  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    
    // Check if element has existing child elements (like mixed-case styling)
    const existingChildren = element.querySelectorAll('span')
    const hasExistingStructure = existingChildren.length > 0

    let targets: NodeListOf<Element> | Element[]

    if (hasExistingStructure) {
      // Preserve existing structure, animate the child spans directly
      targets = existingChildren
    } else {
      // No existing structure, create wrapper
      const text = element.textContent || ''
      
      if (splitByChar) {
        element.innerHTML = text
          .split('')
          .map(char => `<span class="soft-mask-char">${char === ' ' ? '&nbsp;' : char}</span>`)
          .join('')
        targets = element.querySelectorAll('.soft-mask-char')
      } else {
        element.innerHTML = `<span class="soft-mask-text">${text}</span>`
        targets = element.querySelectorAll('.soft-mask-text')
      }
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { 
          opacity: 0, 
          y: hasExistingStructure ? 50 : (splitByChar ? 30 : 100),
          filter: hasExistingStructure ? 'blur(8px)' : (splitByChar ? 'blur(4px)' : 'blur(10px)')
        },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: hasExistingStructure ? 0.9 : (splitByChar ? 0.6 : 0.8),
          stagger: hasExistingStructure ? 0.2 : (splitByChar ? 0.03 : 0),
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [elementRef, splitByChar])
}

const showcaseCards = [
  { image: '/images/img1.png', label: '01 / BRANDING', color: '#ffb000', alt: 'Picarview branding work' },
  { image: '/images/img2.png', label: '02 / 3D ART', color: '#b9ff32', alt: 'Picarview 3D artwork' },
  { image: '/images/img3.png', label: '03 / DIRECTION', color: '#ff4fa3', alt: 'Picarview art direction' },
  { image: '/images/img4.png', label: '04 / VISUALS', color: '#22d9ee', alt: 'Picarview visual design' },
]

// Neo-brutalist collection that assembles automatically when it enters view.
function InteractiveCardsTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { items: siteMedia } = useCmsSiteMedia()
  const cards = showcaseCards.map((card, index) => {
    const replacement = siteMedia.find((item) => item.slot === `expression-${index + 1}`)
    return replacement
      ? { ...card, image: replacement.mediaUrl, alt: replacement.altText }
      : card
  })

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.brutalist-card')
      const heading = gsap.utils.toArray<HTMLElement>('.cards-section__heading span')
      const media = gsap.matchMedia()

      media.add('(prefers-reduced-motion: reduce) and (min-width: 768px)', () => {
        gsap.set(heading, { opacity: 1, y: 0 })
        gsap.set(cards, {
          opacity: 1,
          scale: 1,
          x: (index) => ['-34vw', '-11.5vw', '11.5vw', '34vw'][index],
          y: -8,
          rotation: (index) => [-9, -3, 3, 9][index],
        })
      })

      media.add('(prefers-reduced-motion: reduce) and (max-width: 767px)', () => {
        gsap.set(heading, { opacity: 1, y: 0 })
        gsap.set(cards, {
          opacity: 1,
          scale: 0.78,
          x: (index) => ['-39vw', '-13vw', '13vw', '39vw'][index],
          y: -4,
          rotation: (index) => [-8, -3, 3, 8][index],
        })
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 72%',
            toggleActions: 'play none none none',
            once: true,
          },
        })

        tl.fromTo(
          heading,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
        )

        media.add('(min-width: 768px)', () => {
          gsap.set(cards, {
            opacity: 0,
            scale: 0.12,
            x: 0,
            y: 80,
            z: -900,
            rotation: (index) => [-22, 18, -17, 24][index],
            transformOrigin: '50% 50%',
          })

          tl.to(cards, {
            opacity: 1,
            scale: 1,
            x: (index) => ['-34vw', '-11.5vw', '11.5vw', '34vw'][index],
            y: -8,
            z: 0,
            rotation: (index) => [-9, -3, 3, 9][index],
            duration: 0.9,
            stagger: 0.16,
            ease: 'back.out(1.25)',
          }, '-=0.12')
        })

        media.add('(max-width: 767px)', () => {
          gsap.set(cards, {
            opacity: 0,
            scale: 0.15,
            x: 0,
            y: 56,
            rotation: (index) => [-18, 14, -12, 18][index],
          })

          tl.to(cards, {
            opacity: 1,
            scale: 0.78,
            x: (index) => ['-39vw', '-13vw', '13vw', '39vw'][index],
            y: -4,
            rotation: (index) => [-8, -3, 3, 8][index],
            duration: 0.72,
            stagger: 0.13,
            ease: 'back.out(1.15)',
          }, '-=0.1')
        })
      })

      return () => media.revert()
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <section ref={containerRef} data-theme="light" className="cards-section">
        <div className="cards-section__heading">
          <span>We create and build great ideas</span>
          <span>01—04</span>
        </div>

        <div className="cards-section__deck">
          {cards.map((card) => (
            <article className="brutalist-card" style={{ backgroundColor: card.color }} key={card.label}>
              <div className="brutalist-card__image">
                <img src={card.image} alt={card.alt} />
              </div>
              <span className="brutalist-card__tag">{card.label}</span>
            </article>
          ))}
        </div>

      </section>
    </>
  )
}

// Parallax Window for Works Section
function ParallaxWindowWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const shutterRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          pin: true,
        },
      })

      // Scale up the shutter like expanding window
      tl.to(shutterRef.current, {
        scale: 20,
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
      })
      // Reveal content inside
      .to(contentRef.current, {
        opacity: 1,
        duration: 0.4,
      }, '-=0.6')

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} data-theme="dark" className="parallax-window-container">
      <div className="parallax-window-bg"></div>
      <div ref={shutterRef} className="parallax-window-shutter">
        <div className="w-20 h-20 border-4 border-white rounded-full animate-pulse"></div>
      </div>
      <div ref={contentRef} className="parallax-window-content flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-white text-sm uppercase tracking-[0.4em] mb-4">
            Portfolio
          </p>
          <h3 className="font-urbanist-black text-4xl md:text-6xl uppercase text-white">
            Our Works
          </h3>
        </div>
      </div>
    </div>
  )
}

// About Section - "GET TO knowPICARVIEW"
function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Apply soft mask to heading
  useSoftMaskReveal(headingRef, false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pull the About panel over the final hero frames like the next card in a stack.
      gsap.fromTo(
        sectionRef.current,
        { y: 120, borderTopLeftRadius: 48, borderTopRightRadius: 48 },
        {
          y: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'top 58%',
            scrub: true,
          },
        }
      )

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 30%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="about"
      ref={sectionRef}
      data-theme="dark"
      className="about-cover-section py-28 md:py-40 px-6 md:px-12 lg:px-24"
    >
      <div ref={contentRef} className="max-w-5xl mx-auto">
        <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl mb-12 soft-mask-reveal">
          <span className="bacalisties-script text-white text-5xl md:text-6xl lg:text-7xl">know</span>
          <span className="about-brand-word text-white">picarview</span>
        </h2>
        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p className="about-statement max-w-4xl">
            We are your <em className="about-statement__accent about-statement__accent--creative">creative team</em>, and our goal is to connect{' '}
            <em className="about-statement__accent about-statement__accent--you">you</em> with your{' '}
            <em className="about-statement__accent about-statement__accent--audience">audience</em> through{' '}
            <strong>creativity</strong>, <strong>innovation</strong>, and <strong>design</strong>.
          </p>
        </div>
      </div>
    </section>
  )
}

// Partners statement and CMS-powered collaboration showcase.
function GoalSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const partners = useCmsItems('partner')
  const partnerRowsBase = partners.length >= 6
    ? [partners.slice(0, Math.ceil(partners.length / 2)), partners.slice(Math.ceil(partners.length / 2))]
    : [partners]
  const partnerRows = partnerRowsBase.map((row) => (
    row.length === 0 || row.length >= 4
      ? row
      : Array.from({ length: Math.ceil(4 / row.length) }, () => row).flat()
  ))

  useSoftMaskReveal(textRef, false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      )

      gsap.fromTo(
        '.partners-statement__marquee',
        { opacity: 0, y: 42, rotate: (index) => index % 2 === 0 ? -2 : 2 },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: 0.8,
          stagger: 0.16,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.partners-statement__marquees',
            start: 'top 82%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [partners.length])

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      className="partners-statement"
    >
      <div className="partners-statement__inner">
        <p className="partners-statement__eyebrow">We are creative team</p>
        <h2
          ref={textRef}
          className="partners-statement__text soft-mask-reveal"
        >
          We partner with purpose-driven brands to shape ideas, refine every detail.<br />
          And bring meaningful visions to life through creativity.<br />
          Innovation, and design.
        </h2>
        {partners.length > 0 && (
          <div className="partners-statement__showcase">
            <header>
              <span>Partners</span>
              <span>{String(partners.length).padStart(2, '0')} collaborations</span>
            </header>
            <div className="partners-statement__marquees" aria-label="Picarview partners">
              {partnerRows.map((row, rowIndex) => (
                <div className={`partners-statement__marquee partners-statement__marquee--${rowIndex % 2 === 0 ? 'left' : 'right'}`} key={`row-${rowIndex}`}>
                  <div className="partners-statement__track">
                    {[0, 1].map((copy) => (
                      <div className="partners-statement__group" aria-hidden={copy === 1} key={`copy-${copy}`}>
                        {row.map((partner, index) => (
                          <figure key={`${copy}-${partner.id}-${index}`}>
                            <div className="partners-statement__logo-frame">
                              <img src={partner.imageUrl} alt={copy === 0 ? partner.altText : ''} loading="lazy" />
                            </div>
                            <figcaption>
                              <span>{String(partners.findIndex((item) => item.id === partner.id) + 1).padStart(2, '0')}</span>
                              <strong>{partner.title}</strong>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// Four service pillars assemble when the composition enters the viewport.
function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const services = [
    {
      title: 'Discovery',
      number: '01',
      statement: 'Uncovering the creative opportunity.',
      offerings: [
        'Creative Idea Development',
        'Visual & Identity Exploration',
        'Creative Direction Alignment',
        'Creative Discovery Workshops',
      ],
    },
    {
      title: 'Strategy',
      number: '02',
      statement: 'Giving every creative decision a purpose.',
      offerings: [
        'Campaign Planning',
        'Concept Development',
        'Brand & Audience Research',
        'Creative Strategy & Insights',
      ],
    },
    {
      title: 'Innovation',
      number: '03',
      statement: 'Building new ideas into tangible experiences.',
      offerings: [
        'Creative Innovation',
        'Product Development',
        'Creative Concept Development',
        'Picture & Art Development',
      ],
    },
    {
      title: 'Expression',
      number: '04',
      statement: 'Turning strategy into work people can feel.',
      offerings: [
        'Creative Design',
        'Brand Expression',
        'Photography & Videography',
        'Visual Art & Experimental Content',
      ],
    },
  ]

  useEffect(() => {
    const media = gsap.matchMedia()
    const ctx = gsap.context(() => {
      const pillars = gsap.utils.toArray<HTMLElement>('.service-pillar')

      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          '.service-script__eyebrow, .service-script__title, .service-pillar, .service-pillar li',
          { opacity: 1, x: 0, y: 0, rotate: 0 }
        )
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 72%',
            toggleActions: 'play none none none',
            once: true,
          },
        })

        timeline.fromTo(
          '.service-script__eyebrow, .service-script__title',
          { opacity: 0, x: 35 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        )

        pillars.forEach((pillar, index) => {
          timeline
            .fromTo(
              pillar,
              { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
              {
                opacity: 1,
                clipPath: 'inset(0 0 0% 0)',
                duration: 0.52,
                ease: 'power3.out',
              },
              index === 0 ? '-=0.15' : '-=0.32'
            )
            .fromTo(
              pillar.querySelectorAll('li'),
              { opacity: 0, x: 16 },
              { opacity: 1, x: 0, duration: 0.24, stagger: 0.055, ease: 'power2.out' },
              '<0.18'
            )
        })
      })
    }, sectionRef)

    return () => {
      media.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section
      id="services"
      ref={sectionRef}
      data-theme="light"
      className="service-script"
    >
      <div className="service-script__content">
        <header className="service-script__header">
          <p className="service-script__eyebrow">05 — Services</p>
          <h2 className="service-script__title">Our services</h2>
        </header>

        <div className="service-pillars">
          {services.map((service) => (
            <article className="service-pillar" key={service.title}>
              <header>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
              </header>
              <div className="service-pillar__body">
                <p>{service.statement}</p>
                <ul>
                  {service.offerings.map((offering) => (
                    <li key={offering}>{offering}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const workAccents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']

// Aura-led, horizontally scrolling neo-brutalist work gallery.
function WorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cmsProjects = useCmsItems('project')
  const projects = cmsProjects.length > 0
    ? cmsProjects.slice(0, 12)
    : Array.from({ length: 12 }, (_, index) => ({
        id: `fallback-${index + 1}`,
        imageUrl: `/images/work${index + 1}.png`,
        title: `Picarview selected work ${index + 1}`,
        subtitle: ['Identity', 'Campaign', 'Image-making', 'Art direction'][index % 4],
        altText: `Picarview selected work ${index + 1}`,
      }))
  const projectsKey = projects.map((project) => project.id).join(',')

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.aura-work__card')
      const track = trackRef.current
      if (!track || !cards.length) return

      const getTravel = () => Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.12)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${Math.max(3600, getTravel() * 1.15)}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      timeline
        .fromTo(
          '.aura-work__orb',
          { scale: 0.12, opacity: 0, rotation: -70 },
          { scale: 1, opacity: 0.9, rotation: 35, duration: 0.8, stagger: 0.08, ease: 'power3.out' }
        )
        .fromTo(
          '.aura-work__heading > *',
          { opacity: 0, y: 55, rotateX: -50 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out' },
          0.18
        )
        .fromTo(
          cards,
          {
            opacity: 0,
            scale: 0.16,
            y: (index) => index % 2 === 0 ? 180 : -160,
            rotation: (index) => index % 2 === 0 ? -18 : 18,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            rotation: (index) => [-4, 3, -2, 5][index % 4],
            duration: 0.7,
            stagger: 0.08,
            ease: 'back.out(1.25)',
          },
          0.45
        )
        .to(track, { x: () => -getTravel(), duration: 3.8, ease: 'none' })
        .to('.aura-work__orb--one', { xPercent: 35, yPercent: -20, rotation: 145, duration: 3.8, ease: 'none' }, '<')
        .to('.aura-work__orb--two', { xPercent: -30, yPercent: 25, rotation: -120, duration: 3.8, ease: 'none' }, '<')
        .to(cards, { y: (index) => index % 2 === 0 ? -12 : 12, duration: 0.35, ease: 'power1.inOut' })
    }, sectionRef)

    return () => ctx.revert()
  }, [projectsKey])

  return (
    <section
      id="work"
      ref={sectionRef}
      data-theme="dark"
      className="aura-work"
    >
      <div className="aura-work__atmosphere" aria-hidden="true">
        <div className="aura-work__orb aura-work__orb--one" />
        <div className="aura-work__orb aura-work__orb--two" />
        <div className="aura-work__orb aura-work__orb--three" />
      </div>

      <header className="aura-work__heading">
        <p>06 — Project Page</p>
        <h2>Our <span>Work</span></h2>
        <div className="aura-work__subheading">Check what we have built.</div>
        <div className="aura-work__counter">{projects.length} projects · Scroll to explore</div>
        <Link href="/projects" className="aura-work__cta">
          View all projects
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div ref={trackRef} className="aura-work__track">
        {projects.map((project, index) => (
          <article
            className="aura-work__card"
            style={{ backgroundColor: workAccents[index % workAccents.length] }}
            key={project.id}
          >
            <div className="aura-work__image-wrap">
              <img src={project.imageUrl} alt={project.altText} />
            </div>
            <footer>
              <span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
              <strong>{project.subtitle || 'Selected work'}</strong>
            </footer>
          </article>
        ))}
      </div>

      <div className="aura-work__rail" aria-hidden="true">
        <span>Drag through the atmosphere</span>
        <i />
        <span>Picarview®</span>
      </div>
    </section>
  )
}

// Personality Section
function PersonalitySection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useSoftMaskReveal(headingRef, false)

  const traits = [
    'Creative & Expressive',
    'Clear & Strategic',
    'Intelligent & Thoughtful',
    'Bold & Confident',
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('.personality-card')
      if (!cards) return

      gsap.fromTo(
        cards,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 75%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-4">04 — Personality</p>
          <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl soft-mask-reveal">
            <span className="bacalisties-script text-black text-5xl md:text-6xl lg:text-7xl">ourPERSONALITY</span>
          </h2>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {traits.map((trait) => (
            <div key={trait} className="personality-card">
              <p className="text-xl md:text-2xl font-light text-black">
                {trait}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Promise Section
function PromiseSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useSoftMaskReveal(headingRef, false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = linesRef.current?.querySelectorAll('.promise-line')
      if (!lines) return

      gsap.fromTo(
        lines,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: linesRef.current,
            start: 'top 75%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-black"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-4">05 — Promise</p>
          <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl soft-mask-reveal">
            <span className="bacalisties-script text-white text-5xl md:text-6xl lg:text-7xl">ourPROMISE</span>
          </h2>
        </div>

        <div ref={linesRef} className="space-y-8">
          <p className="promise-line text-2xl md:text-3xl lg:text-4xl text-white font-light leading-relaxed">
            create with <span className="font-bold">purpose</span>
          </p>
          <p className="promise-line text-2xl md:text-3xl lg:text-4xl text-white font-light leading-relaxed">
            create with <span className="font-bold">innovation</span>
          </p>
          <p className="promise-line text-2xl md:text-3xl lg:text-4xl text-white font-light leading-relaxed">
            create to make it <span className="font-bold">fit</span>.
          </p>
          
          <div className="promise-line pt-8 mt-12 border-t border-white/10">
            <p className="text-lg md:text-xl text-zinc-300 leading-relaxed mb-6">
              If Picarview designed it, it&apos;s <span className="text-white font-semibold">intentional</span>,{' '}
              <span className="text-white font-semibold">impactful</span>, and{' '}
              <span className="text-white font-semibold">memorable</span>.
            </p>
            <p className="text-2xl md:text-3xl text-white italic">
              We Create your view
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          once: true,
        },
      })
        .fromTo(
          '.contact-portal__copy > *',
          { opacity: 0, y: 45 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' }
        )
        .fromTo(
          '.contact-portal__card',
          { opacity: 0, scale: 0.72, rotation: 7 },
          { opacity: 1, scale: 1, rotation: -2, duration: 0.8, ease: 'back.out(1.2)' },
          '-=0.35'
        )
        .fromTo(
          '.contact-portal__service',
          { opacity: 0, x: 18 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
          '-=0.35'
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" ref={sectionRef} data-theme="dark" className="contact-portal">
      <div className="contact-portal__aura" aria-hidden="true"><i /><i /></div>

      <div className="contact-portal__inner">
        <div className="contact-portal__copy">
          <h2 className="contact-portal__title" aria-label="Let's create your view">
            <span className="contact-portal__title-line contact-portal__title-line--lets">Let&apos;s</span>
            <span className="contact-portal__title-line contact-portal__title-line--create">create</span>
            <span className="contact-portal__title-line contact-portal__title-line--your">
              <span>your</span><em>view</em>
            </span>
          </h2>
          <p className="contact-portal__intro">
            Only a message away. We will build your idea with purpose, innovation, and make it fit.
          </p>

          <div className="contact-portal__services" aria-label="Selected services">
            {['Discovery', 'Strategy', 'Innovation', 'Expression'].map((item, index) => (
              <span className="contact-portal__service" key={item}>
                {String(index + 1).padStart(2, '0')} / {item}
              </span>
            ))}
          </div>
        </div>

        <Link href="/contact" className="contact-portal__card">
          <span>Project enquiry</span>
          <strong>Tell us what<br />you&apos;re building.</strong>
          <div>
            <span>Open the brief</span>
            <ArrowRight className="h-6 w-6" />
          </div>
        </Link>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  const legalPages = useLegalPages()
  const coreLinks = [
    { slug: 'privacy', title: 'Privacy', href: '/privacy' },
    { slug: 'terms', title: 'Terms', href: '/terms' },
  ]
  const links = [...coreLinks, ...legalPages.filter((page) => page.slug !== 'privacy' && page.slug !== 'terms')]
  return (
    <footer data-theme="dark" className="py-12 px-6 md:px-12 lg:px-24 border-t border-white/15 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" aria-label="Picarview home" className="block transition-opacity hover:opacity-70">
          <Image
            src="/images/Black.png"
            alt="Picarview"
            width={2268}
            height={513}
            className="h-10 w-auto object-contain invert"
          />
        </Link>
        <p className="text-zinc-400 text-sm">© 2026 Picarview. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {links.map((page) => (
            <Link href={page.href} className="text-zinc-400 hover:text-white transition-colors text-sm uppercase tracking-[0.25em]" key={page.slug}>
              {page.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

// Main Content Component
export function ContentSections() {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={contentRef}
      className="content-section content-cover-flow relative"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />

      <AboutSection />
      <InteractiveCardsTransition />
      <GoalSection />
      <ServicesSection />
      <WorksSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
