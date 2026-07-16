'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

// Soft Mask Reveal Hook for headings - preserves existing structure
function useSoftMaskReveal(elementRef: React.RefObject<HTMLElement>, splitByChar = false) {
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

// Pinned neo-brutalist card build between About and Our Foundation.
function InteractiveCardsTransition() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.brutalist-card')
      const media = gsap.matchMedia()

      media.add('(min-width: 768px)', () => {
        gsap.set(cards, { opacity: 0, scale: 0.1, x: 0, y: 0, transformOrigin: '50% 50%' })
        gsap.set(cards[0], { rotation: -20 })
        gsap.set(cards[1], { rotation: 22 })
        gsap.set(cards[2], { rotation: -18 })
        gsap.set(cards[3], { rotation: 24 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=3000',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        tl.to(cards[0], { scale: 1, opacity: 1, rotation: -2, duration: 0.8, ease: 'power3.out' })
          .to(cards[0], { x: '-16vw', rotation: -7, duration: 0.65, ease: 'power2.inOut' })
          .to(cards[1], { scale: 1, opacity: 1, x: '14vw', rotation: 4, duration: 0.75, ease: 'power3.out' }, '<')
          .to(cards[0], { x: '-25vw', rotation: -8, duration: 0.65, ease: 'power2.inOut' })
          .to(cards[1], { x: 0, rotation: -2, duration: 0.65, ease: 'power2.inOut' }, '<')
          .to(cards[2], { scale: 1, opacity: 1, x: '25vw', rotation: 7, duration: 0.75, ease: 'power3.out' }, '<')
          .to(cards[0], { x: '-34vw', rotation: -9, duration: 0.7, ease: 'power2.inOut' })
          .to(cards[1], { x: '-11.5vw', rotation: -3, duration: 0.7, ease: 'power2.inOut' }, '<')
          .to(cards[2], { x: '11.5vw', rotation: 3, duration: 0.7, ease: 'power2.inOut' }, '<')
          .to(cards[3], { scale: 1, opacity: 1, x: '34vw', rotation: 9, duration: 0.8, ease: 'power3.out' }, '<')
          .to(cards, { y: -8, duration: 0.35, ease: 'power1.inOut' })
      })

      media.add('(max-width: 767px)', () => {
        gsap.set(cards, { opacity: 0, scale: 0.12, x: 0, y: 0 })

        const finalX = ['-42vw', '-14vw', '14vw', '42vw']
        const rotations = [-8, -3, 3, 8]
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=2400',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        })

        cards.forEach((card, index) => {
          tl.to(card, {
            opacity: 1,
            scale: 1,
            x: finalX[index],
            rotation: rotations[index],
            duration: 0.75,
            ease: 'power3.out',
          })

          if (index < cards.length - 1) {
            tl.to(cards.slice(0, index + 1), { scale: 0.86, duration: 0.3, ease: 'power2.inOut' })
          }
        })

        tl.to(cards, { scale: 0.86, y: -6, duration: 0.35 })
      })

      return () => media.revert()

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <section ref={containerRef} data-theme="light" className="cards-section">
        <div className="cards-section__heading">
          <span>Selected expressions</span>
          <span>Scroll to collect · 01—04</span>
        </div>

        <div className="cards-section__deck">
          {showcaseCards.map((card) => (
            <article className="brutalist-card" style={{ backgroundColor: card.color }} key={card.label}>
              <div className="brutalist-card__image">
                <img src={card.image} alt={card.alt} />
              </div>
              <span className="brutalist-card__tag">{card.label}</span>
            </article>
          ))}
        </div>

        <span className="cards-section__index" aria-hidden="true">PICARVIEW®</span>
      </section>

      <section data-theme="dark" className="foundation-intro">
        <p>Unveiling Excellence</p>
        <h3>Our Foundation</h3>
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
          <h3 className="font-metropolis-black text-4xl md:text-6xl uppercase text-white">
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
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-8">02 — Page</p>
        <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl mb-12 soft-mask-reveal">
          <span className="metropolis-upper text-white">GET TO </span>
          <span className="bacalisties-script text-white text-5xl md:text-6xl lg:text-7xl">knowPICARVIEW</span>
        </h2>
        <div className="space-y-6 text-lg md:text-xl text-zinc-300 leading-relaxed">
          <p className="text-2xl md:text-3xl text-white font-light leading-normal">
            We are your creative team.
          </p>
          <p className="text-xl md:text-2xl italic text-zinc-400 max-w-4xl">
            Focused on combining creativity, innovation, and design to shape visual experiences that go beyond
            appearance delivering depth, clarity, and lasting impact.
          </p>
          <p className="max-w-4xl">
            We go beyond aesthetics, bringing your ideas to life in ways that allow them to evolve across multiple
            dimensions, connect with their environment, and leave a lasting impression.
          </p>
        </div>
      </div>
    </section>
  )
}

// Mission/Vision Cards Grid
function MissionVisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const cards = [
    {
      label: 'Partners Page',
      content: 'Partners Page',
    },
    {
      label: 'What we value',
      content: 'We work with brands that play a role in the environment today and tomorrow.',
    },
    {
      label: 'What we make',
      content: 'Creating ideas and connecting with their audience through pictures and arts innovation.',
    },
    {
      label: 'How we grow',
      content: 'Ideas that evolve with clarity, depth, and lasting impact.',
    },
    {
      label: 'Vision',
      content: 'Our vision is to build partnerships that shape the future of visual expression.',
    },
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cardElements = cardsRef.current?.querySelectorAll('.info-card')
      if (!cardElements) return

      gsap.fromTo(
        cardElements,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
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
      <div className="max-w-7xl mx-auto mb-16">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-4">03 — Page</p>
        <h2 className="stylish-header text-4xl md:text-5xl lg:text-6xl soft-mask-reveal">
          <span className="metropolis-upper text-black">PARTNERS </span>
          <span className="bacalisties-script text-black text-5xl md:text-6xl lg:text-7xl">Page</span>
        </h2>
      </div>

      <div ref={cardsRef} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className={`info-card ${index === cards.length - 1 ? 'md:col-span-2 lg:col-span-3' : ''}`}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">
              {card.label}
            </p>
            <p className="text-base md:text-lg text-black leading-relaxed">
              {card.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// Goal Statement Section
function GoalSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)

  useSoftMaskReveal(labelRef, true)
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-black"
    >
      <div className="max-w-6xl mx-auto text-center">
        <p ref={labelRef} className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-12 soft-mask-reveal">04 — Page</p>
        <h2
          ref={textRef}
          className="text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight soft-mask-reveal"
        >
          We partner with brands that play a role in the environment today and tomorrow, creating ideas and connecting
          with their audience through pictures and arts innovation.
        </h2>
      </div>
    </section>
  )
}

// Scroll-written service statements over the open space in img5.
function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const services = [
    {
      title: 'Discovery',
      number: '01',
      statement: 'Finding the idea worth seeing',
    },
    {
      title: 'Strategy',
      number: '02',
      statement: 'Giving every visual a reason',
    },
    {
      title: 'Direction',
      number: '03',
      statement: 'Shaping a language people feel',
    },
    {
      title: 'Expression',
      number: '04',
      statement: 'Making the work impossible to forget',
    },
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>('.service-script__row')
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=2200',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      })

      timeline.fromTo(
        '.service-script__eyebrow, .service-script__title',
        { opacity: 0, x: 35 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.12, ease: 'power2.out' }
      )

      rows.forEach((row) => {
        const label = row.querySelector('.service-script__label')
        const characters = row.querySelectorAll('.service-script__char')

        timeline
          .fromTo(label, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.18 })
          .fromTo(
            characters,
            { opacity: 0, yPercent: 55, rotate: 4 },
            {
              opacity: 1,
              yPercent: 0,
              rotate: 0,
              duration: 0.055,
              stagger: 0.018,
              ease: 'power2.out',
            },
            '<0.04'
          )
          .fromTo(
            row.querySelector('.service-script__stroke'),
            { scaleX: 0 },
            { scaleX: 1, duration: 0.26, ease: 'power2.inOut' },
            '<0.16'
          )
      })

      timeline.to('.service-script__content', { y: -8, duration: 0.3, ease: 'power1.inOut' })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="services"
      ref={sectionRef}
      data-theme="light"
      className="service-script"
    >
      <img className="service-script__background" src="/images/img5.png" alt="Editorial fashion composition" />
      <div className="service-script__wash" aria-hidden="true" />

      <div className="service-script__content">
        <p className="service-script__eyebrow">05 — Services</p>
        <h2 className="service-script__title">
          What we bring <span>to the frame</span>
        </h2>

        <div className="service-script__lines">
          {services.map((service) => (
            <div className={`service-script__row service-script__row--${service.number}`} key={service.title}>
              <span className="service-script__label">{service.number} / {service.title}</span>
              <p aria-label={service.statement}>
                <span className="sr-only">{service.statement}</span>
                <span aria-hidden="true">
                  {service.statement.split('').map((character, index) => (
                    <span className="service-script__char" key={`${character}-${index}`}>
                      {character === ' ' ? '\u00a0' : character}
                    </span>
                  ))}
                </span>
              </p>
              <span className="service-script__stroke" aria-hidden="true" />
            </div>
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
  }, [])

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
        <h2><span>Selected</span> work with an aura.</h2>
        <div className="aura-work__counter">12 projects · Scroll to explore</div>
      </header>

      <div ref={trackRef} className="aura-work__track">
        {Array.from({ length: 12 }, (_, index) => (
          <article
            className="aura-work__card"
            style={{ backgroundColor: workAccents[index % workAccents.length] }}
            key={`work-${index + 1}`}
          >
            <div className="aura-work__image-wrap">
              <img src={`/images/work${index + 1}.png`} alt={`Picarview selected work ${index + 1}`} />
            </div>
            <footer>
              <span>{String(index + 1).padStart(2, '0')} / 12</span>
              <strong>{['Identity', 'Campaign', 'Image-making', 'Art direction'][index % 4]}</strong>
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
  return (
    <section id="contact" data-theme="light" className="relative py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-white text-black overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-end">
        <div className="space-y-8">
          <div className="space-y-4 max-w-xl">
            <p className="text-[0.68rem] uppercase tracking-[0.45em] text-zinc-400">06 — Contact</p>
            <h2 className="font-metropolis-black text-4xl md:text-5xl lg:text-6xl uppercase text-black leading-[0.92]">
              A lighter way to begin the conversation.
            </h2>
          </div>

          <div className="max-w-xl space-y-5 text-base md:text-lg text-zinc-600 leading-[1.9]">
            <p>
              Tap the floating orb in the bottom-right corner whenever you&apos;re ready. It opens the full brief without
              taking over the page.
            </p>
            <p>
              That keeps the experience clean, and gives you a quicker way to reach us from anywhere on the site.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {['Tap to open', 'Quick brief', 'Designed for flow'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-zinc-600"
              >
                {item}
              </span>
            ))}
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.3em] text-black transition-opacity hover:opacity-60"
          >
            Open the contact page
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex justify-start lg:justify-end">
          <div className="pointer-events-none hidden lg:block h-64 w-64 rounded-full border border-dashed border-black/10" />
        </div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer data-theme="light" className="py-12 px-6 md:px-12 lg:px-24 border-t border-black/10 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="font-metropolis-black text-2xl uppercase text-black">Picarview</span>
        </div>
        <p className="text-zinc-500 text-sm">© 2026 Picarview. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-zinc-500 hover:text-black transition-colors text-sm uppercase tracking-[0.25em]">
            Privacy
          </a>
          <a href="#" className="text-zinc-500 hover:text-black transition-colors text-sm uppercase tracking-[0.25em]">
            Terms
          </a>
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
      <MissionVisionSection />
      <GoalSection />
      <ServicesSection />
      <WorksSection />
      <PersonalitySection />
      <PromiseSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
