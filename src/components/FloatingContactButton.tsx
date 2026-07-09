'use client'

import Link from 'next/link'
import { MessageCircleMore } from 'lucide-react'

export function FloatingContactButton() {
  return (
    <Link
      href="/contact"
      className="group fixed bottom-5 right-5 z-50 flex items-center overflow-hidden rounded-full border border-black/10 bg-white/95 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] md:bottom-8 md:right-8"
      aria-label="Contact us"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0b0b0b_0%,#262626_100%)] text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
        <MessageCircleMore className="h-5 w-5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap px-0 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:px-4 group-hover:opacity-100">
        Contact Us
      </span>
    </Link>
  )
}