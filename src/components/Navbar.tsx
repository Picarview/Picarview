'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

gsap.registerPlugin(ScrollTrigger)

export function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navTheme, setNavTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
      )

    }, navRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('[data-theme]')
      
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section as HTMLElement,
          start: 'top top',
          end: 'bottom top',
          onEnter: () => {
            const theme = section.getAttribute('data-theme')
            setNavTheme(theme === 'light' ? 'light' : 'dark')
          },
          onEnterBack: () => {
            const theme = section.getAttribute('data-theme')
            setNavTheme(theme === 'light' ? 'light' : 'dark')
          },
        })
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Work', href: '#work' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <>
      <Link
        href="/"
        className="site-nav-logo"
        aria-label="Picarview home"
      >
        <div className="relative h-7 w-28 md:h-8 md:w-32">
          <Image
            src="/logo-black.png"
            alt="Picarview Logo"
            fill
            sizes="(max-width: 768px) 128px, 144px"
            className="object-contain"
            priority
          />
        </div>
      </Link>

      <nav
        ref={navRef}
        className={`site-nav site-nav--${navTheme}`}
      >
        <div className="site-nav__inner">
          <div className="site-nav__links">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                className="site-nav__link"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {link.name}
              </a>
            ))}
          </div>

          <button
            className="site-nav__toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <span>Menu</span>
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      <div
        className={`site-mobile-menu ${isMenuOpen ? 'is-open' : ''}`}
      >
        <div className="site-mobile-menu__header">Picarview® / Navigation</div>
        <div className="site-mobile-menu__links">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="site-mobile-menu__link"
              style={{
                transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isMenuOpen ? 1 : 0,
                transition: `all 0.5s ease ${index * 0.1}s`,
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {link.name}
            </a>
          ))}
        </div>
        <p className="site-mobile-menu__footer">Create your view · Accra / Worldwide</p>
      </div>
    </>
  )
}
