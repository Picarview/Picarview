'use client'

import { ArrowRight } from 'lucide-react'

interface ContactFormProps {
  submitLabel?: string
}

export function ContactForm({ submitLabel = 'Start the Conversation' }: ContactFormProps) {
  return (
    <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
      <div className="contact-form__row">
        <label>
          <span>01 / Your name</span>
          <input
            type="text"
            name="name"
            placeholder="How should we address you?"
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>02 / Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
      </div>

      <label>
        <span>03 / Project type</span>
        <input
          type="text"
          name="projectType"
          placeholder="Brand identity, campaign, art direction..."
        />
      </label>

      <label>
        <span>04 / Tell us about the idea</span>
        <textarea
          name="message"
          rows={7}
          placeholder="The ambition, timeline, and anything else we should know."
          required
        />
      </label>

      <div className="contact-form__action">
        <button
          type="submit"
        >
          {submitLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p>We usually respond within 2 business days.</p>
      </div>
    </form>
  )
}
