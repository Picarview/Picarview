import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cookies } from 'next/headers'
import { getCmsEnv, SESSION_COOKIE, verifyAdminSession, type CmsLegalPage } from '@/lib/cloudflare-cms'

interface LegalSection { heading: string; body: string }

export async function LegalPage({ slug, missingTitle, preview = false }: { slug: string; missingTitle?: string; preview?: boolean }) {
  let page: CmsLegalPage | null = null
  try {
    const { CMS_DB, ADMIN_SESSION_SECRET } = getCmsEnv()
    const cookieStore = await cookies()
    const canPreview = preview && await verifyAdminSession(cookieStore.get(SESSION_COOKIE)?.value, ADMIN_SESSION_SECRET)
    page = CMS_DB ? await CMS_DB.prepare(canPreview
      ? 'SELECT slug, title, introduction, sections_json, effective_date, published, updated_at FROM legal_pages WHERE slug = ?'
      : 'SELECT slug, title, introduction, sections_json, effective_date, published, updated_at FROM legal_pages WHERE slug = ? AND published = 1'
    ).bind(slug).first<CmsLegalPage>() : null
  } catch (error) {
    console.error('Legal page query failed', error)
  }

  let sections: LegalSection[] = []
  if (page) {
    try {
      const parsed: unknown = JSON.parse(page.sections_json)
      if (Array.isArray(parsed)) sections = parsed as LegalSection[]
    } catch { sections = [] }
  }

  const fallbackTitle = missingTitle || (slug === 'privacy' ? 'Privacy Policy' : slug === 'terms' ? 'Terms & Conditions' : 'Legal document')
  return (
    <main className="legal-page">
      <nav className="legal-page__nav">
        <Link href="/" aria-label="Picarview home"><Image src="/images/Black.png" alt="Picarview" width={2268} height={513} priority /></Link>
        <Link href="/"><ArrowLeft className="h-4 w-4" /> Back home</Link>
      </nav>
      <article className="legal-page__document">
        {preview && page && !page.published && <div className="legal-page__preview-banner">Admin preview · This document is not public</div>}
        <header>
          <p>Legal · Picarview</p>
          <h1>{page?.title || fallbackTitle}</h1>
          {page?.effective_date && <time>Effective {page.effective_date}</time>}
        </header>
        {!page ? (
          <section className="legal-page__coming-soon">
            <span>Document in preparation</span>
            <h2>Coming soon.</h2>
            <p>We&apos;re preparing this document with care. Please check back shortly or contact us if you need information in the meantime.</p>
            <Link href="/contact">Contact Picarview</Link>
          </section>
        ) : (
          <div className="legal-page__content">
            {page.introduction && <p className="legal-page__intro">{page.introduction}</p>}
            {sections.map((section, index) => (
              <section key={`${section.heading}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><h2>{section.heading}</h2>{section.body.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              </section>
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
