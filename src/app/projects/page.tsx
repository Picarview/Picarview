import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import projectImages from '@/generated/project-images.json'

export const metadata: Metadata = {
  title: 'Projects | Picarview',
  description: 'Explore the complete Picarview archive of visual design, campaigns, and image-making.',
}

const accents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']
const disciplines = ['Identity', 'Campaign', 'Image-making', 'Art direction']

export default function ProjectsPage() {
  return (
    <main className="project-archive">
      <div className="project-archive__aura" aria-hidden="true"><i /><i /></div>

      <header className="project-archive__header">
        <Link href="/#work" className="project-archive__back">
          <ArrowLeft className="h-4 w-4" />
          Back to Picarview
        </Link>

        <div className="project-archive__intro">
          <p>Project archive · {String(projectImages.length).padStart(2, '0')}</p>
          <h1>Every view.<br /><span>One archive.</span></h1>
          <div>
            <p>A growing collection of identities, campaigns, visual systems, and images created with intention.</p>
            <span>{projectImages.length} projects and counting</span>
          </div>
        </div>
      </header>

      <section className="project-archive__grid" aria-label="All Picarview projects">
        {projectImages.map((image, index) => (
          <article
            className="project-archive__card"
            style={{ backgroundColor: accents[index % accents.length] }}
            key={image}
          >
            <div className="project-archive__image">
              <Image
                src={image}
                alt={`Picarview project ${index + 1}`}
                fill
                sizes="(max-width: 560px) 88vw, (max-width: 900px) 44vw, 30vw"
                className="object-cover"
              />
            </div>
            <footer>
              <span>{String(index + 1).padStart(2, '0')} / {String(projectImages.length).padStart(2, '0')}</span>
              <strong>{disciplines[index % disciplines.length]}</strong>
              <ArrowUpRight className="h-4 w-4" />
            </footer>
          </article>
        ))}
      </section>

      <footer className="project-archive__footer">
        <span>Picarview®</span>
        <p>The archive grows with the practice.</p>
        <Link href="/contact">Start a project <ArrowUpRight className="h-4 w-4" /></Link>
      </footer>
    </main>
  )
}
