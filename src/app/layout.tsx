import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { LenisProvider } from '@/components/LenisProvider'
import { FloatingContactButton } from '@/components/FloatingContactButton'

const metropolisBlack = localFont({
  src: '../../public/fonts/Metropolis-Black.otf',
  variable: '--font-metropolis-black',
  display: 'swap',
})

const metropolisBold = localFont({
  src: '../../public/fonts/Metropolis-Bold.otf',
  variable: '--font-metropolis-bold',
  display: 'swap',
})

const bacalisties = localFont({
  src: '../../public/fonts/Bacalisties.ttf',
  variable: '--font-bacalisties',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Picarview | Premium Creative Agency',
  description: 'Create your view. A creative company focused on shaping how pictures, art, and visual ideas are perceived.',
  metadataBase: new URL('https://picarview.com'),
  openGraph: {
    title: 'Picarview | Premium Creative Agency',
    description: 'Create your view. A creative company focused on shaping how pictures, art, and visual ideas are perceived.',
    url: 'https://picarview.com',
    siteName: 'Picarview',
    images: [
      {
        url: '/logo-black.png',
        width: 1200,
        height: 630,
        alt: 'Picarview Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Picarview | Premium Creative Agency',
    description: 'Create your view. A creative company focused on shaping how pictures, art, and visual ideas are perceived.',
    images: ['/logo-black.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-black.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${metropolisBlack.variable} ${metropolisBold.variable} ${bacalisties.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <LenisProvider>
          {children}
        </LenisProvider>
        {/* Noise texture overlay for premium feel */}
        <div className="noise-overlay" />
        <FloatingContactButton />
      </body>
    </html>
  )
}
