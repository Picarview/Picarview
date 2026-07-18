import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="contact-page__aura" aria-hidden="true"><i /><i /></div>

      <nav className="contact-page__nav">
        <Link href="/" aria-label="Picarview home">
          <Image src="/logo-white.png" alt="Picarview" width={150} height={60} className="h-10 w-auto" priority />
        </Link>
        <Link href="/" className="contact-page__back">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </nav>

      <section className="contact-page__layout">
        <div className="contact-page__story">
          <div>
            <p className="contact-page__eyebrow">Start a project · 2026</p>
            <h1>Let&apos;s make<br /><span>the idea visible.</span></h1>
          </div>

          <p className="contact-page__lead">
            Share the ambition. We&apos;ll bring clarity, direction, and a visual language built to last.
          </p>

          <div className="contact-page__details">
            <div>
              <span>New business</span>
              <a href="mailto:create@picarview.com">
                create@picarview.com
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div>
              <span>Working across</span>
              <p>Identity · Campaigns<br />Art direction · Image-making</p>
            </div>
          </div>
        </div>

        <div className="contact-page__form-card">
          <header>
            <span>Project enquiry</span>
            <i>01—04</i>
          </header>
          <ContactForm />
        </div>
      </section>

      <footer className="contact-page__footer">
        <span>Picarview®</span>
        <p>Independent creative practice</p>
        <span>Available worldwide</span>
      </footer>
    </main>
  )
}
