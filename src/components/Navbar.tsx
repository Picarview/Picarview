'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLenis } from 'lenis/react'
import { ArrowUpRight } from 'lucide-react'

const menuLinks = [
  { name: 'Home', href: '/', image: '/images/work1.webp', note: 'Create your view' },
  { name: 'Work', href: '/projects', image: '/images/work3.webp', note: 'Selected projects' },
  { name: 'Studio', href: '/about', image: '/images/img3.webp', note: 'Our team & partners' },
  { name: 'Services', href: '/services', image: '/images/img1.webp', note: 'What we do' },
  { name: 'Contact', href: '/contact', image: '/images/img4.webp', note: 'Start a project' },
]

const quickLinks = [
  { name: 'Start a project', href: '/contact' },
  { name: 'All projects', href: '/projects' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(0)
  const pathname = usePathname()
  const lenis = useLenis()
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close on route change: adjust state during render rather than in an effect.
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return
    lenis?.stop()
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = previousOverflow
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, lenis])

  const activeIndex = menuLinks.findIndex((link) => link.href === pathname || (link.href !== '/' && pathname.startsWith(link.href)))

  return (
    <>
      <header className={`site-header ${isOpen ? 'is-open' : ''}`}>
        <Link href="/" className="site-header__logo" aria-label="Picarview home">
          <Image src="/images/logo.webp" alt="Picarview" width={900} height={204} priority />
        </Link>
        <div className="site-header__actions">
          <Link href="/contact" className="site-header__talk">Let&apos;s talk</Link>
          <button
            ref={toggleRef}
            type="button"
            className="site-header__toggle"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="site-menu"
          >
            <span className="site-header__toggle-label">{isOpen ? 'Close' : 'Menu'}</span>
            <span className="site-header__burger" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>

      <div
        id="site-menu"
        className={`site-menu ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-lenis-prevent
      >
        <div className="site-menu__inner">
          <nav className="site-menu__links" aria-label="Main">
            {menuLinks.map((link, index) => (
              <Link
                href={link.href}
                key={link.name}
                className={`site-menu__link ${index === activeIndex ? 'is-current' : ''}`}
                style={{ transitionDelay: isOpen ? `${0.18 + index * 0.06}s` : '0s' }}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onClick={() => setIsOpen(false)}
              >
                <span className="site-menu__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="site-menu__word" data-text={link.name}>{link.name}</span>
                <span className="site-menu__note">{link.note}</span>
              </Link>
            ))}
          </nav>

          <aside className="site-menu__aside">
            <div className="site-menu__preview" aria-hidden="true">
              {menuLinks.map((link, index) => (
                <Image
                  key={link.image}
                  src={link.image}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 0px, 30vw"
                  className={index === hovered ? 'is-visible' : ''}
                />
              ))}
            </div>

            <div className="site-menu__contact">
              <span>Say hello</span>
              <a href="mailto:create@picarview.com">create@picarview.com</a>
              <ul>
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} onClick={() => setIsOpen(false)}>
                      {link.name}<ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <footer className="site-menu__footer">
          <span>Picarview® — independent creative practice</span>
          <span className="site-menu__tagline">Create <em>your</em> view</span>
        </footer>
      </div>
    </>
  )
}
