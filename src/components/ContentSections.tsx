'use client'

import { useRef, useEffect, useState } from 'react'
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

// Diagonal Razor Transition
function DiagonalRazorTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const topPanelRef = useRef<HTMLDivElement>(null)
  const bottomPanelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const preAnimRef = useRef<HTMLDivElement>(null)
  const ringsRef = useRef<HTMLDivElement>(null)
  const scanLineRef = useRef<HTMLDivElement>(null)
  const [particles] = useState(() => 
    Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2
    }))
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=160%',
          scrub: 1,
          pin: true,
        },
      })

      // Initial pre-animations (rings, scan lines, particles)
      tl.fromTo(preAnimRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.45 }
      )
      .to(ringsRef.current,
        { scale: 1.5, opacity: 0.8, duration: 0.6 },
        0
      )
      .to(scanLineRef.current,
        { y: '100vh', duration: 0.75 },
        0.1
      )
      // Fade out pre-animations
      .to(preAnimRef.current, {
        opacity: 0,
        duration: 0.35,
      })
      // Slide panels in diagonally
      .to([topPanelRef.current, bottomPanelRef.current], {
        x: 0,
        duration: 1.4,
        ease: 'power2.inOut',
      })
      // Lock together and fade in content
      .to(contentRef.current, {
        opacity: 1,
        duration: 0.7,
      }, '-=0.3')

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} data-theme="dark" className="diagonal-razor-container">
      {/* Pre-animations layer */}
      <div ref={preAnimRef} className="diagonal-pre-anim">
        {/* Concentric rings */}
        <div ref={ringsRef} className="diagonal-rings">
          <div className="diagonal-ring"></div>
          <div className="diagonal-ring"></div>
          <div className="diagonal-ring"></div>
        </div>
        
        {/* Scan line */}
        <div ref={scanLineRef} className="diagonal-scan-line"></div>
        
        {/* Floating particles */}
        <div className="diagonal-particles">
          {particles.map((particle, i) => (
            <div 
              key={i} 
              className="diagonal-particle"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Diagonal panels */}
      <div ref={topPanelRef} className="diagonal-panel diagonal-panel-top" />
      <div ref={bottomPanelRef} className="diagonal-panel diagonal-panel-bottom" />
      
      {/* Content */}
      <div ref={contentRef} className="diagonal-content">
        <div className="text-center px-6">
          <p className="text-white text-sm uppercase tracking-[0.4em] mb-4">
            Unveiling Excellence
          </p>
          <h3 className="font-metropolis-black text-4xl md:text-6xl uppercase text-white">
            Our Foundation
          </h3>
        </div>
      </div>
    </div>
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
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-black"
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

// Services Section with Hover Cards
function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useSoftMaskReveal(headingRef, false)

  const services = [
    {
      title: 'Discovery',
      number: '01',
      subServices: [
        'Creative Idea Development',
        'Visual & Identity Exploration',
        'Creative Direction Alignment',
        'Creative Discovery Workshops',
      ],
    },
    {
      title: 'Strategy',
      number: '02',
      subServices: [
        'Campaign Planning',
        'Concept Development',
        'Brand & Audience Research',
        'Creative Strategy & Insights',
      ],
    },
    {
      title: 'Innovation',
      number: '03',
      subServices: [
        'Creative Innovation',
        'Product Development',
        'Creative Concepts Build-up',
        'Pictures & Arts Development',
      ],
    },
    {
      title: 'Expression',
      number: '04',
      subServices: [
        'Creative Design',
        'Brand Expression',
        'Photography, Videography',
        'Visual Art & Experimental Content',
      ],
    },
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cardElements = cardsRef.current?.querySelectorAll('.service-card')
      if (!cardElements) return

      gsap.fromTo(
        cardElements,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
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
      id="services"
      ref={sectionRef}
      data-theme="light"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-4">05 — Services</p>
          <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl soft-mask-reveal">
            <span className="metropolis-upper text-black">SERVICE </span>
            <span className="bacalisties-script text-black text-5xl md:text-6xl lg:text-7xl">pillars.</span>
          </h2>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {services.map((service) => (
            <div key={service.title} className="service-card">
              <div className="service-card-content">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4">
                  {service.number}
                </p>
                <h3 className="font-metropolis-black text-3xl md:text-4xl uppercase text-black mb-4">
                  {service.title}
                </h3>
              </div>
              <div className="service-card-expanded mt-6">
                <ul className="space-y-3">
                  {service.subServices.map((sub) => (
                    <li key={sub} className="text-sm text-zinc-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">→</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Works Gallery Section
function WorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useSoftMaskReveal(headingRef, false)

  const colorBlocks = [
    { gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' },
    { gradient: 'bg-gradient-to-br from-orange-500 to-orange-700' },
    { gradient: 'bg-gradient-to-br from-blue-600 to-orange-600' },
    { gradient: 'bg-gradient-to-br from-zinc-800 to-zinc-950' },
    { gradient: 'bg-gradient-to-br from-orange-400 to-blue-600' },
    { gradient: 'bg-gradient-to-br from-blue-400 to-zinc-800' },
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      const blocks = gridRef.current?.querySelectorAll('.work-block')
      if (!blocks) return

      gsap.fromTo(
        blocks,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 75%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="work"
      ref={sectionRef}
      data-theme="dark"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 bg-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-4">06 — Project Page</p>
          <h2 ref={headingRef} className="stylish-header text-4xl md:text-5xl lg:text-6xl soft-mask-reveal">
            <span className="metropolis-upper text-white">PROJECT </span>
            <span className="bacalisties-script text-white text-5xl md:text-6xl lg:text-7xl">Page</span>
          </h2>
          <p className="mt-6 max-w-3xl text-base md:text-lg text-zinc-300 leading-relaxed">
            We bring your ideas to life, evolve them across multiple dimensions, connect with their environment, and
            leave a lasting impression.
          </p>
          <a
            href="#work"
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
          >
            Check Our Works
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {colorBlocks.map((block, index) => (
            <div key={index} className={`work-block ${block.gradient}`}>
              <div className="work-block-overlay">
                <p className="text-white text-sm uppercase tracking-[0.3em]">Coming Soon</p>
              </div>
            </div>
          ))}
        </div>
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
      className="content-section relative mt-[100vh]"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />

      <AboutSection />
      <DiagonalRazorTransition />
      <MissionVisionSection />
      <GoalSection />
      <ServicesSection />
      <ParallaxWindowWorks />
      <WorksSection />
      <PersonalitySection />
      <PromiseSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
