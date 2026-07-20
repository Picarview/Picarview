'use client'

import Link from 'next/link'
import { MessageCircleMore } from 'lucide-react'

export function FloatingContactButton() {
  return (
    <Link
      href="/contact"
      className="floating-contact group"
      aria-label="Contact us"
    >
      <span className="floating-contact__icon">
        <MessageCircleMore className="h-5 w-5" />
      </span>
      <span className="floating-contact__label">
        Contact Us
      </span>
    </Link>
  )
}
