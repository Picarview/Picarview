import { Hero } from '@/components/Hero'
import { ContentSections } from '@/components/ContentSections'
import { Navbar } from '@/components/Navbar'
import heroFrames from '@/generated/hero-frames.json'

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero frames={heroFrames} />
      <ContentSections />
    </main>
  )
}
