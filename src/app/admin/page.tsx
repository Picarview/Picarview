'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LoaderCircle, LogOut, Plus, Search, Trash2, X } from 'lucide-react'

interface AdminItem {
  id: string
  type: 'partner' | 'project'
  title: string
  subtitle: string
  altText: string
  sortOrder: number
  imageUrl: string
  published: boolean
  createdAt: string
}

interface AdminResponse {
  error?: string
  items?: AdminItem[]
}

interface UploadState {
  open: boolean
  progress: number
  status: string
}

async function readAdminResponse(response: Response): Promise<AdminResponse> {
  const data: unknown = await response.json()
  return typeof data === 'object' && data !== null ? data as AdminResponse : {}
}

function uploadContent(formData: FormData, onProgress: (progress: number) => void): Promise<AdminResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', '/api/admin/items')
    request.responseType = 'json'
    request.timeout = 120_000

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return
      // Reserve the final 8% for R2 storage and the D1 database write.
      onProgress(Math.min(92, Math.round((event.loaded / event.total) * 92)))
    })

    request.addEventListener('load', () => {
      const data = typeof request.response === 'object' && request.response !== null
        ? request.response as AdminResponse
        : {}
      if (request.status >= 200 && request.status < 300) {
        resolve(data)
      } else {
        reject(new Error(data.error ?? 'Unable to save content.'))
      }
    })
    request.addEventListener('error', () => reject(new Error('The upload was interrupted. Check your connection and try again.')))
    request.addEventListener('abort', () => reject(new Error('The upload was cancelled.')))
    request.addEventListener('timeout', () => reject(new Error('The upload took too long. Please try again on a stronger connection.')))
    request.send(formData)
  })
}

export default function AdminPage() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ open: false, progress: 0, status: 'Preparing upload…' })
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AdminItem['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '365'>('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [visibleCount, setVisibleCount] = useState(6)

  const loadItems = useCallback(async () => {
    const response = await fetch('/api/admin/items', { cache: 'no-store' })
    if (response.status === 401) {
      setAuthenticated(false)
      return
    }
    const data = await readAdminResponse(response)
    if (!response.ok) {
      setAuthenticated(false)
      setMessage(data.error ?? 'CMS is not configured yet.')
      return
    }
    setItems(Array.isArray(data.items) ? data.items : [])
    setAuthenticated(true)
  }, [])

  useEffect(() => { void loadItems() }, [loadItems])
  useEffect(() => { setVisibleCount(6) }, [search, typeFilter, statusFilter, dateFilter, sort])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = dateFilter === 'all' ? 0 : Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000

    return items
      .filter((item) => typeFilter === 'all' || item.type === typeFilter)
      .filter((item) => statusFilter === 'all' || (statusFilter === 'published' ? item.published : !item.published))
      .filter((item) => !cutoff || new Date(`${item.createdAt}Z`).getTime() >= cutoff)
      .filter((item) => !query || `${item.title} ${item.subtitle} ${item.altText}`.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title)
        const difference = new Date(`${b.createdAt}Z`).getTime() - new Date(`${a.createdAt}Z`).getTime()
        return sort === 'newest' ? difference : -difference
      })
  }, [dateFilter, items, search, sort, statusFilter, typeFilter])

  const visibleItems = filteredItems.slice(0, visibleCount)

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const password = new FormData(event.currentTarget).get('password')
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await readAdminResponse(response)
    setBusy(false)
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to sign in.')
      return
    }
    await loadItems()
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setMessage('')
    setUpload({ open: true, progress: 0, status: 'Preparing upload…' })

    try {
      await uploadContent(new FormData(form), (progress) => {
        setUpload({ open: true, progress, status: progress >= 92 ? 'Saving to the content library…' : 'Uploading image…' })
      })
      setUpload({ open: true, progress: 100, status: 'Published successfully' })
      form.reset()
      window.setTimeout(() => {
        setUpload((current) => ({ ...current, open: false }))
      }, 650)
      // Refresh independently so a slow library request can never trap the success modal.
      void loadItems()
    } catch (error) {
      setUpload((current) => ({ ...current, open: false }))
      setMessage(error instanceof Error ? error.message : 'Unable to save content.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteItem() {
    if (!deleteTarget) return
    const item = deleteTarget
    setBusy(true)
    setDeletingId(item.id)
    const response = await fetch(`/api/admin/items?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
    setBusy(false)
    setDeletingId(null)
    if (!response.ok) {
      const data = await readAdminResponse(response)
      setMessage(data.error ?? 'Unable to delete entry.')
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    await loadItems()
  }

  async function logout() {
    setSigningOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setAuthenticated(false)
      setItems([])
    } finally {
      setSigningOut(false)
    }
  }

  if (authenticated === null) {
    return <main className="admin-shell admin-shell--center"><p>Loading Picarview CMS…</p></main>
  }

  if (!authenticated) {
    return (
      <main className="admin-shell admin-shell--center">
        <form className="admin-login" onSubmit={login}>
          <p>Picarview®</p>
          <h1>Admin access</h1>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required autoFocus />
          </label>
          <button disabled={busy}>{busy ? 'Checking…' : 'Enter dashboard'}</button>
          {message && <p className="admin-message">{message}</p>}
          <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to website</Link>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p>Picarview® CMS</p><h1>Content dashboard</h1></div>
        <div>
          <Link href="/">View website</Link>
          <button onClick={() => void logout()} disabled={signingOut}>
            {signingOut ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <section className="admin-layout">
        <form className="admin-create" onSubmit={createItem}>
          <header><Plus className="h-5 w-5" /><h2>Add content</h2></header>
          <label><span>Content type</span>
            <select name="type"><option value="project">Project</option><option value="partner">Partner logo</option></select>
          </label>
          <label><span>Title</span><input name="title" placeholder="Project or partner name" required /></label>
          <label><span>Subtitle</span><input name="subtitle" placeholder="Identity, campaign, industry…" /></label>
          <label><span>Image description</span><input name="altText" placeholder="Accessible description" required /></label>
          <label><span>Status</span>
            <select name="published" defaultValue="true"><option value="true">Published</option><option value="false">Draft</option></select>
          </label>
          <label className="admin-upload"><span>Image or logo · max 10 MB</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required /></label>
          <button disabled={busy}>{busy ? 'Working…' : 'Upload and save'}</button>
          {message && <p className="admin-message">{message}</p>}
        </form>

        <div className="admin-library">
          <header>
            <div><p>Library</p><h2>{filteredItems.length} of {items.length}</h2></div>
            <span>{items.filter((item) => !item.published).length} drafts</span>
          </header>
          <div className="admin-library__tools">
            <label className="admin-library__search">
              <span className="sr-only">Search content</span>
              <Search className="h-4 w-4" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, categories…" />
            </label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} aria-label="Filter by content type">
              <option value="all">All content</option>
              <option value="project">Projects</option>
              <option value="partner">Partners</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter by publication status">
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as typeof dateFilter)} aria-label="Filter by upload date">
              <option value="all">Any date</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="365">Last year</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort content">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A—Z</option>
            </select>
          </div>
          {items.length === 0 ? (
            <div className="admin-empty">No CMS content yet. Existing repository projects remain visible as fallback.</div>
          ) : filteredItems.length === 0 ? (
            <div className="admin-empty">No entries match these filters.</div>
          ) : (
            <>
              <div className="admin-items">
                {visibleItems.map((item) => (
                  <article className="admin-item" key={item.id}>
                    <div className="admin-item__image">
                      <Image src={item.imageUrl} alt={item.altText} fill sizes="120px" className="object-cover" unoptimized />
                    </div>
                    <div>
                      <span>{item.type} · {item.published ? 'Published' : 'Draft'}</span>
                      <h3>{item.title}</h3>
                      <p>{item.subtitle || 'No subtitle'} · {new Date(`${item.createdAt}Z`).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setDeleteTarget(item)} disabled={busy} aria-label={`Delete ${item.title}`}>
                      {deletingId === item.id ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </article>
                ))}
              </div>
              {visibleCount < filteredItems.length && (
                <button className="admin-view-more" onClick={() => setVisibleCount((count) => count + 6)}>
                  View 6 more <span>{filteredItems.length - visibleCount} remaining</span>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {upload.open && (
        <div className="admin-progress-modal" role="dialog" aria-modal="true" aria-labelledby="upload-progress-title">
          <div className="admin-progress-card">
            <div className="admin-progress-card__topline">
              <p id="upload-progress-title">Adding new content</p>
              <strong>{upload.progress}%</strong>
            </div>
            <div
              className="admin-progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={upload.progress}
            >
              <span style={{ width: `${upload.progress}%` }} />
            </div>
            <p className="admin-progress-status">{upload.status}</p>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="admin-delete-card">
            <button
              className="admin-delete-card__close"
              onClick={() => setDeleteTarget(null)}
              disabled={busy}
              aria-label="Close deletion dialog"
            >
              <X className="h-5 w-5" />
            </button>
            <span>Permanent action</span>
            <h2 id="delete-modal-title">Delete this entry?</h2>
            <p>
              <strong>{deleteTarget.title}</strong> and its uploaded image will be permanently removed.
              This cannot be undone.
            </p>
            <div className="admin-delete-card__actions">
              <button onClick={() => setDeleteTarget(null)} disabled={busy}>Keep entry</button>
              <button onClick={() => void deleteItem()} disabled={busy}>
                {deletingId ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                {busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
