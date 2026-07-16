import { readdirSync } from 'fs'
import { join } from 'path'
import { Hero } from '@/components/Hero'
import { ContentSections } from '@/components/ContentSections'
import { Navbar } from '@/components/Navbar'

export default function Home() {
  // The sequence can be replaced without renaming files or updating a frame count.
  const heroFrames = readdirSync(join(process.cwd(), 'public', 'hero'))
    .filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => `/hero/${file}`)

  return (
    <main className="relative">
      <Navbar />
      <Hero frames={heroFrames} />
      <ContentSections />
    </main>
  )
}
