'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { useCmsItems, type PublicCmsItem } from '@/hooks/useCmsItems'

gsap.registerPlugin(ScrollTrigger)

const LOGOS_PER_ROW = 6
const MAX_ROWS = 3
/** Rows with fewer logos than this sit still; fuller rows scroll like a ticker. */
const MARQUEE_MIN = 5

function chunkRows(partners: PublicCmsItem[]) {
  const rowCount = Math.min(MAX_ROWS, Math.max(1, Math.ceil(partners.length / LOGOS_PER_ROW)))
  const size = Math.ceil(partners.length / rowCount)
  return Array.from({ length: rowCount }, (_, index) => partners.slice(index * size, (index + 1) * size))
    .filter((row) => row.length > 0)
}

/**
 * Partner logos on a dark band: a large heading, then rows of white single-colour
 * logos separated by rules. Logos come from the CMS (Admin → Partners).
 */
export function Partnerships() {
  const sectionRef = useRef<HTMLElement>(null)
  const partners = useCmsItems('partner')
  const rows = chunkRows(partners)

  useEffect(() => {
    if (!partners.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.partnerships__title', { yPercent: 100 }, {
        yPercent: 0, duration: 1, ease: 'power4.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.fromTo('.partnerships__row', { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.partnerships__rows', start: 'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [partners.length])

  if (!partners.length) return null

  return (
    <section ref={sectionRef} className="partnerships" data-theme="dark" aria-labelledby="partnerships-title">
      <div className="partnerships__inner">
        <header className="partnerships__head">
          <h2 id="partnerships-title" className="partnerships__title-wrap">
            <span className="partnerships__title">Partnerships</span>
          </h2>
          <p className="partnerships__note">
            <span className="partnerships__note-line">Brands we&apos;ve <em>built with</em>.</span>
            <span className="partnerships__count">{String(partners.length).padStart(2, '0')} and counting</span>
          </p>
        </header>

        <div className="partnerships__rows">
          {rows.map((row, rowIndex) => {
            const moving = row.length >= MARQUEE_MIN
            const copies = moving ? [0, 1] : [0]
            return (
              <div
                className={`partnerships__row ${moving ? 'is-moving' : ''} ${rowIndex % 2 ? 'is-reverse' : ''}`}
                key={rowIndex}
              >
                <div className="partnerships__track">
                  {copies.map((copy) => (
                    <ul className="partnerships__group" aria-hidden={copy === 1} key={copy}>
                      {row.map((partner) => (
                        <li key={`${copy}-${partner.id}`} title={partner.title}>
                          <img src={partner.imageUrl} alt={copy === 0 ? (partner.altText || partner.title) : ''} loading="lazy" decoding="async" />
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Link href="/contact" className="partnerships__cta">
          Become a partner <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
