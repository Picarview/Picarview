'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, FileText, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'

export interface AdminLegalPage {
  slug: 'privacy' | 'terms'
  title: string
  introduction: string
  sections: { heading: string; body: string }[]
  effectiveDate: string
  published: boolean
  updatedAt: string
}

export function AdminLegalEditor({ pages, onSaved }: { pages: AdminLegalPage[]; onSaved: () => Promise<void> }) {
  const [slug, setSlug] = useState<'privacy' | 'terms'>('privacy')
  const selected = pages.find((page) => page.slug === slug)
  const [draft, setDraft] = useState<AdminLegalPage | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDraft(selected ? structuredClone(selected) : {
      slug,
      title: slug === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions',
      introduction: '', sections: [], effectiveDate: '', published: false, updatedAt: '',
    })
    setMessage('')
  }, [selected, slug])

  if (!draft) return null

  function updateSection(index: number, field: 'heading' | 'body', value: string) {
    setDraft((current) => current && ({ ...current, sections: current.sections.map((section, itemIndex) => itemIndex === index ? { ...section, [field]: value } : section) }))
  }

  function moveSection(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current
      const destination = index + direction
      if (destination < 0 || destination >= current.sections.length) return current
      const sections = [...current.sections]
      ;[sections[index], sections[destination]] = [sections[destination], sections[index]]
      return { ...current, sections }
    })
  }

  async function save() {
    const document = draft
    if (!document) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/legal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Unable to save the document.')
      setMessage(document.published ? 'Published successfully.' : 'Draft saved successfully.')
      await onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the document.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-legal">
      <header className="admin-legal__topbar">
        <div><p>Legal content</p><h2>Document studio</h2></div>
        <div className="admin-legal__tabs">
          <button className={slug === 'privacy' ? 'is-active' : ''} onClick={() => setSlug('privacy')}>Privacy</button>
          <button className={slug === 'terms' ? 'is-active' : ''} onClick={() => setSlug('terms')}>Terms</button>
        </div>
      </header>

      <div className="admin-legal__workspace">
        <div className="admin-legal__editor">
          <div className="admin-legal__status">
            <span className={draft.published ? 'is-live' : ''}>{draft.published ? 'Live on website' : 'Private draft'}</span>
            {draft.updatedAt && <time>Updated {new Date(`${draft.updatedAt}Z`).toLocaleDateString()}</time>}
          </div>
          <label><span>Document title</span><input value={draft.title} maxLength={100} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label><span>Effective date</span><input value={draft.effectiveDate} maxLength={40} placeholder="e.g. 24 July 2026" onChange={(event) => setDraft({ ...draft, effectiveDate: event.target.value })} /></label>
          <label><span>Opening summary</span><textarea value={draft.introduction} maxLength={1200} rows={5} placeholder="A short, reader-friendly introduction to this document…" onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} /></label>

          <div className="admin-legal__sections-heading">
            <div><span>Document sections</span><small>Build the policy one clear section at a time.</small></div>
            <button onClick={() => setDraft({ ...draft, sections: [...draft.sections, { heading: '', body: '' }] })}><Plus /> Add section</button>
          </div>

          <div className="admin-legal__sections">
            {draft.sections.map((section, index) => (
              <article key={index}>
                <header><strong>{String(index + 1).padStart(2, '0')}</strong><div><button onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move section up"><ArrowUp /></button><button onClick={() => moveSection(index, 1)} disabled={index === draft.sections.length - 1} aria-label="Move section down"><ArrowDown /></button><button onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Delete section"><Trash2 /></button></div></header>
                <input value={section.heading} maxLength={160} placeholder="Section heading" onChange={(event) => updateSection(index, 'heading', event.target.value)} />
                <textarea value={section.body} maxLength={8000} rows={8} placeholder={'Write this section in clear paragraphs.\n\nLeave a blank line between paragraphs.'} onChange={(event) => updateSection(index, 'body', event.target.value)} />
              </article>
            ))}
            {draft.sections.length === 0 && <div className="admin-legal__empty"><FileText /><strong>No sections yet</strong><p>Add the first section when the legal copy is ready.</p></div>}
          </div>

          <footer className="admin-legal__actions">
            <label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span>Publish this document on the website</span></label>
            <div><a href={`/${slug}`} target="_blank" rel="noreferrer"><Eye /> Preview page</a><button onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="admin-spinner" /> : <Save />}{saving ? 'Saving…' : 'Save document'}</button></div>
          </footer>
          {message && <p className="admin-legal__message">{message}</p>}
        </div>

        <aside className="admin-legal__guide">
          <span>Writing guide</span><h3>Clear documents build trust.</h3>
          <ol><li>Use one topic per section.</li><li>Prefer plain language.</li><li>Add paragraph breaks for readability.</li><li>Keep the page private until approved.</li></ol>
          <p>The public page automatically shows “Coming soon” while this document is unpublished.</p>
        </aside>
      </div>
    </section>
  )
}
