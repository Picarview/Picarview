import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="relative px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-8 lg:sticky lg:top-20">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500 transition-colors hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>

            <div className="space-y-4 max-w-xl">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-zinc-400">Contact</p>
              <h1 className="font-metropolis-black text-4xl md:text-5xl lg:text-7xl uppercase leading-[0.92]">
                Great Ideas are timeless | Let&apos;s work together
              </h1>
            </div>

            <div className="space-y-5 max-w-xl text-base md:text-lg leading-[1.9] text-zinc-600">
              <p>
                Great ideas are timeless, and they deserve a clear place to begin.
              </p>
              <p>
                Tell us what you have in mind and we&apos;ll help shape the next step with you.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {['Name', 'Email/Contact', 'Share your Ideas'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-zinc-600"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="space-y-2 text-sm uppercase tracking-[0.28em] text-zinc-500">
              <p>info@picarview.com</p>
              <p>create@picarview.com</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,#fcfcfc_0%,#f7f7f7_100%)] p-6 md:p-8 lg:p-10 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}