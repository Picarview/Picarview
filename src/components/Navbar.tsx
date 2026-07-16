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
      // Fade in navbar
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
      )

    }, navRef)

    return () => ctx.revert()
  }, [])

  // Separate effect for theme switching - runs after content is mounted
  useEffect(() => {
    // Delay to ensure all sections are rendered
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('[data-theme]')
      
      console.log('Found sections with data-theme:', sections.length)
      
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section as HTMLElement,
          start: 'top top',
          end: 'bottom top',
          onEnter: () => {
            const theme = section.getAttribute('data-theme')
            console.log('Entering section with theme:', theme)
            setNavTheme(theme === 'light' ? 'light' : 'dark')
          },
          onEnterBack: () => {
            const theme = section.getAttribute('data-theme')
            console.log('Entering back section with theme:', theme)
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
        className="fixed left-6 top-4 z-50 mix-blend-difference"
        aria-label="Picarview home"
      >
        <div className="relative h-8 w-32 md:h-10 md:w-36">
          <Image
            src="/logo-white.png"
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
        className="fixed top-4 right-6 z-50 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 md:px-6 py-2.5 md:py-3"
      >
        <div className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-[0.65rem] uppercase tracking-[0.22em] transition-colors duration-300 ease-in-out ${
                  navTheme === 'light' 
                    ? 'text-zinc-700 hover:text-black' 
                    : 'text-zinc-200 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 transition-colors duration-300 ease-in-out ${
              navTheme === 'light' ? 'text-black' : 'text-white'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-all duration-500 md:hidden ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-3xl font-metropolis-black uppercase tracking-tight hover:text-white transition-colors"
              style={{
                transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isMenuOpen ? 1 : 0,
                transition: `all 0.5s ease ${index * 0.1}s`,
              }}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
