'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, FileText, LoaderCircle, Plus, Save, Trash2, X } from 'lucide-react'

export interface AdminLegalPage {
  slug: string
  title: string
  introduction: string
  sections: { heading: string; body: string }[]
  effectiveDate: string
  published: boolean
  updatedAt: string
}

const blankDocument = (): AdminLegalPage => ({ slug: '', title: '', introduction: '', sections: [], effectiveDate: '', published: false, updatedAt: '' })
const documentHref = (slug: string) => `${slug === 'privacy' || slug === 'terms' ? `/${slug}` : `/legal/${slug}`}?preview=1`

export function AdminLegalEditor({ pages, onSaved }: { pages: AdminLegalPage[]; onSaved: () => Promise<void> }) {
  const [selectedSlug, setSelectedSlug] = useState('privacy')
  const [draft, setDraft] = useState<AdminLegalPage | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminLegalPage | null>(null)
  const [message, setMessage] = useState('')
  const selected = pages.find((page) => page.slug === selectedSlug)

  useEffect(() => {
    if (creating) return
    setDraft(selected ? structuredClone(selected) : null)
    setMessage('')
  }, [creating, selected])

  function beginCreate() {
    setCreating(true)
    setSelectedSlug('')
    setDraft(blankDocument())
    setMessage('')
  }

  function selectDocument(slug: string) {
    setCreating(false)
    setSelectedSlug(slug)
  }

  function updateTitle(title: string) {
    if (!draft) return
    const slug = creating ? title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) : draft.slug
    setDraft({ ...draft, title, slug })
  }

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
    if (!draft) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/legal', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, creating }) })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Unable to save the document.')
      const savedSlug = draft.slug
      setCreating(false)
      setSelectedSlug(savedSlug)
      setMessage(draft.published ? 'Published successfully.' : 'Draft saved successfully.')
      await onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the document.')
    } finally { setSaving(false) }
  }

  async function removeDocument() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/legal?slug=${encodeURIComponent(deleteTarget.slug)}`, { method: 'DELETE' })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Unable to delete the document.')
      setDeleteTarget(null)
      setSelectedSlug('privacy')
      await onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete the document.')
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  return (
    <section className="admin-legal">
      <header className="admin-legal__topbar">
        <div><p>Legal content</p><h2>Document studio</h2></div>
        <button className="admin-legal__create" onClick={beginCreate}><Plus /> New document</button>
      </header>

      <nav className="admin-legal__document-list" aria-label="Legal documents">
        {pages.map((page) => <button className={!creating && selectedSlug === page.slug ? 'is-active' : ''} onClick={() => selectDocument(page.slug)} key={page.slug}><span>{page.title}</span><i className={page.published ? 'is-live' : ''}>{page.published ? 'Live' : 'Draft'}</i></button>)}
        {pages.length === 0 && <p>No documents yet.</p>}
      </nav>

      {draft ? <div className="admin-legal__workspace">
        <div className="admin-legal__editor">
          <div className="admin-legal__status"><span className={draft.published ? 'is-live' : ''}>{creating ? 'New private draft' : draft.published ? 'Live on website' : 'Private draft'}</span>{draft.updatedAt && <time>Updated {new Date(`${draft.updatedAt}Z`).toLocaleDateString()}</time>}</div>
          <label><span>Document title</span><input value={draft.title} maxLength={100} placeholder="e.g. Cookie Policy" onChange={(event) => updateTitle(event.target.value)} /></label>
          <label><span>Page URL</span><div className="admin-legal__slug"><span>picarview.com/legal/</span><input value={draft.slug} maxLength={60} disabled={!creating} placeholder="cookie-policy" onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-') })} /></div><small>{creating ? 'Generated from the title; you can adjust it before the first save.' : 'The URL is locked after creation so shared links never break.'}</small></label>
          <label><span>Effective date</span><input value={draft.effectiveDate} maxLength={40} placeholder="e.g. 24 July 2026" onChange={(event) => setDraft({ ...draft, effectiveDate: event.target.value })} /></label>
          <label><span>Opening summary</span><textarea value={draft.introduction} maxLength={1200} rows={5} placeholder="A short, reader-friendly introduction…" onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} /></label>

          <div className="admin-legal__sections-heading"><div><span>Document sections</span><small>Build the policy one clear section at a time.</small></div><button onClick={() => setDraft({ ...draft, sections: [...draft.sections, { heading: '', body: '' }] })}><Plus /> Add section</button></div>
          <div className="admin-legal__sections">
            {draft.sections.map((section, index) => <article key={index}><header><strong>{String(index + 1).padStart(2, '0')}</strong><div><button onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move section up"><ArrowUp /></button><button onClick={() => moveSection(index, 1)} disabled={index === draft.sections.length - 1} aria-label="Move section down"><ArrowDown /></button><button onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Delete section"><Trash2 /></button></div></header><input value={section.heading} maxLength={160} placeholder="Section heading" onChange={(event) => updateSection(index, 'heading', event.target.value)} /><textarea value={section.body} maxLength={8000} rows={8} placeholder={'Write this section in clear paragraphs.\n\nLeave a blank line between paragraphs.'} onChange={(event) => updateSection(index, 'body', event.target.value)} /></article>)}
            {draft.sections.length === 0 && <div className="admin-legal__empty"><FileText /><strong>No sections yet</strong><p>Add the first section when the legal copy is ready.</p></div>}
          </div>

          <footer className="admin-legal__actions">
            <label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span>Publish and add this document to the website footer</span></label>
            <div>{!creating && <a href={documentHref(draft.slug)} target="_blank" rel="noreferrer"><Eye /> Preview</a>}{!creating && draft.slug !== 'privacy' && draft.slug !== 'terms' && <button className="is-danger" onClick={() => setDeleteTarget(draft)}><Trash2 /> Delete</button>}<button onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="admin-spinner" /> : <Save />}{saving ? 'Saving…' : creating ? 'Create document' : 'Save document'}</button></div>
          </footer>
          {message && <p className="admin-legal__message">{message}</p>}
        </div>
        <aside className="admin-legal__guide"><span>Writing guide</span><h3>Clear documents build trust.</h3><ol><li>Use one topic per section.</li><li>Prefer plain language.</li><li>Add paragraph breaks for readability.</li><li>Keep the page private until approved.</li></ol><p>Published documents appear in the website footer automatically.</p></aside>
      </div> : <div className="admin-legal__empty admin-legal__empty--page"><FileText /><strong>Select or create a document</strong></div>}

      {deleteTarget && <div className="admin-delete-modal" role="dialog" aria-modal="true"><div className="admin-delete-card"><button className="admin-delete-card__close" onClick={() => setDeleteTarget(null)} disabled={deleting}><X /></button><span>Permanent action</span><h2>Delete this document?</h2><p><strong>{deleteTarget.title}</strong> will be removed from the dashboard, its public page, and the footer.</p><div className="admin-delete-card__actions"><button onClick={() => setDeleteTarget(null)} disabled={deleting}>Keep document</button><button onClick={() => void removeDocument()} disabled={deleting}>{deleting ? <LoaderCircle className="admin-spinner" /> : <Trash2 />}{deleting ? 'Deleting…' : 'Delete permanently'}</button></div></div></div>}
    </section>
  )
}
