import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Start a Project',
  description: 'Start a conversation with Picarview about brand identity, campaigns, art direction, photography, or visual design.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Start a Project | Picarview',
    description: 'Bring Picarview the ambition. We will help shape the strategy, direction, and visual expression.',
    url: '/contact',
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="contact-page__aura" aria-hidden="true"><i /><i /></div>

      <nav className="contact-page__nav">
        <Link href="/" aria-label="Picarview home">
          <Image src="/images/Black.svg" alt="Picarview" width={150} height={60} className="h-10 w-auto invert" priority />
        </Link>
        <Link href="/" className="contact-page__back">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </nav>

      <section className="contact-page__layout">
        <div className="contact-page__story">
          <div>
            <p className="contact-page__eyebrow">Have an idea?</p>
            <h1>Let&apos;s create something<br /><span>worth remembering.</span></h1>
          </div>

          <p className="contact-page__lead">
            Every great project starts with a conversation. Whether you have a fully developed vision or just the
            beginning of an idea, we&apos;d love to hear about it. Tell us a little about yourself and your project, and
            we&apos;ll get back to you with the best next steps for you.
          </p>

          <p className="contact-page__note">
            The questions we ask might seem vague, but they are designed to help us see your project through your eyes
            so we can build it. Don&apos;t worry if you don&apos;t have all the answers yet. Answer as best as you can and
            leave the rest to us. That&apos;s what we&apos;re here for.
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
