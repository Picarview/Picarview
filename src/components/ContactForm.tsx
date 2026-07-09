'use client'

import { ArrowRight } from 'lucide-react'

interface ContactFormProps {
  submitLabel?: string
}

export function ContactForm({ submitLabel = 'Start the Conversation' }: ContactFormProps) {
  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Name</span>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Email/Contact</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Share your Ideas</span>
        <textarea
          name="message"
          rows={6}
          placeholder="Tell us what you are thinking."
          className="w-full rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-black placeholder:text-zinc-400 focus:border-black focus:outline-none resize-none"
        />
      </label>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-3 self-start rounded-full border border-black bg-black px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
        >
          {submitLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[0.7rem] text-zinc-500 uppercase tracking-[0.28em]">hello@picarview.com</p>
      </div>
    </form>
  )
}