import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { StudioPage } from '@/components/StudioPage'

export const metadata: Metadata = {
  title: 'The Studio',
  description: 'Meet Picarview: an independent creative practice for brand identity, art direction and image-making. Our principles, our team and how we work.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'The Studio | Picarview',
    description: 'Our principles, our team and how we work.',
    url: '/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <StudioPage />
    </>
  )
}
