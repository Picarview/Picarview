'use client'

import { ArrowRight } from 'lucide-react'

interface ContactFormProps {
  submitLabel?: string
}

export function ContactForm({ submitLabel = 'Start the Conversation' }: ContactFormProps) {
  const services = ['Discovery', 'Strategy', 'Innovation', 'Expression', 'Other']

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

      <fieldset className="contact-form__choices">
        <legend>03 / How can we help you create your view?</legend>
        <div>
          {services.map((service) => (
            <label key={service}>
              <input type="checkbox" name="services" value={service} />
              <span>{service}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="contact-form__row">
        <label>
          <span>04 / Project timeline</span>
          <select name="timeline" defaultValue="">
            <option value="" disabled>Select a timeline</option>
            <option>As soon as possible</option>
            <option>Within 1–2 months</option>
            <option>Within 3–6 months</option>
            <option>Flexible / exploring</option>
          </select>
        </label>

        <label>
          <span>05 / Want to partner?</span>
          <select name="partnership" defaultValue="">
            <option value="" disabled>Select a partnership</option>
            <option>Short project</option>
            <option>Long-term partnership</option>
            <option>Not sure yet</option>
          </select>
        </label>
      </div>

      <label>
        <span>06 / Estimated budget</span>
        <select name="budget" defaultValue="">
          <option value="" disabled>Select a range</option>
          <option>Under $2,500</option>
          <option>$2,500 – $5,000</option>
          <option>$5,000 – $10,000</option>
          <option>$10,000 – $25,000</option>
          <option>$25,000+</option>
          <option>Let&apos;s discuss</option>
        </select>
      </label>

      <label>
        <span>07 / Tell us about your project</span>
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
