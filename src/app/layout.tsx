import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { LenisProvider } from '@/components/LenisProvider'
import { FloatingContactButton } from '@/components/FloatingContactButton'

const urbanistBlack = localFont({
  src: '../../public/fonts/Primary Font/Primary Font/Urbanist/Urbanist-VariableFont_wght.ttf',
  variable: '--font-urbanist-black',
  weight: '900',
  display: 'swap',
})

const urbanistBold = localFont({
  src: '../../public/fonts/Primary Font/Primary Font/Urbanist/Urbanist-VariableFont_wght.ttf',
  variable: '--font-urbanist-bold',
  weight: '700',
  display: 'swap',
})

const bacalisties = localFont({
  src: '../../public/fonts/Bacalisties.ttf',
  variable: '--font-bacalisties',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Create your view',
    template: '%s | Picarview',
  },
  description: 'Picarview is an independent creative practice shaping brand identities, campaigns, art direction, photography, and visual experiences.',
  metadataBase: new URL('https://picarview.com'),
  applicationName: 'Picarview',
  creator: 'Picarview',
  publisher: 'Picarview',
  category: 'Design',
  keywords: [
    'Picarview',
    'creative agency',
    'graphic design',
    'brand identity',
    'art direction',
    'photography',
    'visual design',
    'creative studio',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Create your view | Picarview',
    description: 'An independent creative practice shaping identities, campaigns, art direction, photography, and visual experiences.',
    url: '/',
    siteName: 'Picarview',
    images: [
      {
        url: '/social-preview.png',
        width: 1200,
        height: 630,
        alt: 'Picarview — Create your view',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create your view | Picarview',
    description: 'An independent creative practice shaping identities, campaigns, art direction, photography, and visual experiences.',
    images: ['/social-preview.png'],
  },
  icons: {
    icon: '/images/Black.png',
    shortcut: '/images/Black.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://picarview.com/#organization',
    name: 'Picarview',
    url: 'https://picarview.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://picarview.com/images/Black.png',
      width: 2268,
      height: 513,
    },
    email: 'create@picarview.com',
    description: 'An independent creative practice shaping brand identities, campaigns, art direction, photography, and visual experiences.',
    areaServed: 'Worldwide',
    knowsAbout: [
      'Brand identity',
      'Creative strategy',
      'Campaign planning',
      'Art direction',
      'Photography',
      'Videography',
      'Visual art',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://picarview.com/#website',
    url: 'https://picarview.com',
    name: 'Picarview',
    publisher: { '@id': 'https://picarview.com/#organization' },
    inLanguage: 'en',
  }

  return (
    <html lang="en" className={`${urbanistBlack.variable} ${urbanistBold.variable} ${bacalisties.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]).replace(/</g, '\\u003c'),
          }}
        />
      </head>
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
