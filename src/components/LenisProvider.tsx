'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

interface LenisProviderProps {
  children: ReactNode
}

/**
 * Lenis keeps its own scroll position, so on client-side navigation the new page
 * would open wherever the previous one was scrolled to. Jump to the top on every
 * route change (unless the URL targets an anchor).
 */
function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    if (window.location.hash) return
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }, [pathname, lenis])

  return null
}

export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.5,
        smoothWheel: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
        infinite: false,
      }}
    >
      <ScrollToTopOnNavigate />
      {children}
    </ReactLenis>
  )
}
