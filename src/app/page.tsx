import { Hero } from '@/components/Hero'
import { ContentSections } from '@/components/ContentSections'
import { Navbar } from '@/components/Navbar'

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <ContentSections />
    </main>
  )
}
