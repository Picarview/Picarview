'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LogOut, Plus, Trash2 } from 'lucide-react'

interface AdminItem {
  id: string
  type: 'partner' | 'project'
  title: string
  subtitle: string
  altText: string
  sortOrder: number
  imageUrl: string
  published: boolean
}

interface AdminResponse {
  error?: string
  items?: AdminItem[]
}

async function readAdminResponse(response: Response): Promise<AdminResponse> {
  const data: unknown = await response.json()
  return typeof data === 'object' && data !== null ? data as AdminResponse : {}
}

export default function AdminPage() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

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
    setBusy(true)
    setMessage('Uploading image and saving content…')
    const response = await fetch('/api/admin/items', { method: 'POST', body: new FormData(event.currentTarget) })
    const data = await readAdminResponse(response)
    setBusy(false)
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to save content.')
      return
    }
    event.currentTarget.reset()
    setMessage('Published successfully.')
    await loadItems()
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this entry and its uploaded image?')) return
    setBusy(true)
    const response = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) {
      const data = await readAdminResponse(response)
      setMessage(data.error ?? 'Unable to delete entry.')
      return
    }
    await loadItems()
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthenticated(false)
    setItems([])
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
          <button onClick={logout}><LogOut className="h-4 w-4" /> Sign out</button>
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
          <div className="admin-create__row">
            <label><span>Display order</span><input name="sortOrder" type="number" defaultValue="0" /></label>
            <label><span>Status</span>
              <select name="published" defaultValue="true"><option value="true">Published</option><option value="false">Draft</option></select>
            </label>
          </div>
          <label className="admin-upload"><span>Image or logo · max 10 MB</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required /></label>
          <button disabled={busy}>{busy ? 'Working…' : 'Upload and save'}</button>
          {message && <p className="admin-message">{message}</p>}
        </form>

        <div className="admin-library">
          <header><div><p>Library</p><h2>{items.length} entries</h2></div></header>
          {items.length === 0 ? (
            <div className="admin-empty">No CMS content yet. Existing repository projects remain visible as fallback.</div>
          ) : (
            <div className="admin-items">
              {items.map((item) => (
                <article className="admin-item" key={item.id}>
                  <div className="admin-item__image">
                    <Image src={item.imageUrl} alt={item.altText} fill sizes="120px" className="object-cover" unoptimized />
                  </div>
                  <div><span>{item.type} · {item.published ? 'Published' : 'Draft'}</span><h3>{item.title}</h3><p>{item.subtitle || 'No subtitle'}</p></div>
                  <button onClick={() => deleteItem(item.id)} disabled={busy} aria-label={`Delete ${item.title}`}><Trash2 className="h-4 w-4" /></button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
