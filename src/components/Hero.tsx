'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { useCmsSiteMedia } from '@/hooks/useCmsSiteMedia'

gsap.registerPlugin(ScrollTrigger)

/**
 * Full-bleed studio reel with no text on top, followed by an intro band:
 * a small label on the left and a large statement with italic accents on the right.
 */
export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { items: siteMedia } = useCmsSiteMedia()
  const heroMedia = siteMedia.find((item) => item.slot === 'hero')
  // Phones get a portrait cut of the reel; pick the matching poster once mounted.
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setIsPhone(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if ((reduceMotion || connection?.saveData) && videoRef.current) videoRef.current.pause()
    if (reduceMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-reel__media', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' })

      // Parallax: the reel drifts at half speed as the intro band scrolls over it.
      gsap.to('.hero-reel__media', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-reel', start: 'top top', end: 'bottom top', scrub: true },
      })

      gsap.fromTo('.hero-intro__label', { opacity: 0, x: -24 }, {
        opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.hero-intro', start: 'top 75%' },
      })
      gsap.fromTo('.hero-intro__line', { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.hero-intro', start: 'top 75%' },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      <section className="hero-reel" data-theme="dark" aria-label="Picarview studio reel">
        <div className="hero-reel__media">
          {heroMedia?.mediaType === 'image' ? (
            <img src={heroMedia.mediaUrl} alt={heroMedia.altText} fetchPriority="high" decoding="async" />
          ) : (
            <video
              ref={videoRef}
              key={heroMedia?.mediaUrl ?? 'reel'}
              poster={isPhone ? '/hero/reel-portrait-poster.webp' : '/hero/reel-poster.webp'}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label={heroMedia?.altText || 'Picarview studio reel: a montage of brand identities, posters and campaigns'}
            >
              {heroMedia?.mediaType === 'video' ? (
                <source src={heroMedia.mediaUrl} />
              ) : (
                <>
                  <source src="/hero/reel-portrait.mp4" type="video/mp4" media="(max-width: 767px)" />
                  <source src="/hero/reel.webm" type="video/webm" />
                  <source src="/hero/reel.mp4" type="video/mp4" />
                </>
              )}
            </video>
          )}
        </div>
      </section>

      <section className="hero-intro" data-theme="light" aria-labelledby="hero-intro-title">
        <div className="hero-intro__gradient" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="hero-intro__inner">
          <h1 id="hero-intro-title" className="hero-intro__label">
            <span>We are Picarview</span>
            <i aria-hidden="true" />
          </h1>
          <div className="hero-intro__copy">
            <p className="hero-intro__line">
              a creative partner focused on <em>brand thinking</em> and <em>story-driven</em> visuals.
            </p>
            <p className="hero-intro__line">
              We shape ideas and bring them to life through <em>strategy</em>, <em>identity</em>,{' '}
              <em>art direction</em>, and <em>photography</em>.
            </p>
            <p className="hero-intro__line hero-intro__kicker">
              Think boldly, create your view<span>.</span>
            </p>
            <Link href="/projects" className="hero-intro__line hero-intro__link">
              See our work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
