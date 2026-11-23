'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLegalPages } from '@/hooks/useLegalPages'

export function SiteFooter() {
  const legalPages = useLegalPages()
  const links = [
    { slug: 'privacy', title: 'Privacy', href: '/privacy' },
    { slug: 'terms', title: 'Terms', href: '/terms' },
    ...legalPages.filter((page) => page.slug !== 'privacy' && page.slug !== 'terms'),
  ]

  return (
    <footer className="site-footer" data-theme="dark">
      <Link href="/contact" className="site-footer__cta">
        <span className="site-footer__cta-eyebrow">Have something in mind?</span>
        <span className="site-footer__cta-title">
          Let&apos;s create <em>your</em> view
          <ArrowUpRight className="site-footer__cta-arrow" />
        </span>
      </Link>
      <div className="site-footer__bar">
        <Link href="/" aria-label="Picarview home" className="site-footer__logo">
          <Image src="/images/logo.webp" alt="Picarview" width={900} height={204} />
        </Link>
        <nav aria-label="Site">
          <Link href="/projects">Work</Link>
          <Link href="/about">Studio</Link>
          <Link href="/services">Services</Link>
        </nav>
        <a href="mailto:create@picarview.com">create@picarview.com</a>
        <nav aria-label="Legal">
          {links.map((page) => <Link href={page.href} key={page.slug}>{page.title}</Link>)}
        </nav>
        <span>© {new Date().getFullYear()} Picarview</span>
      </div>
    </footer>
  )
}
