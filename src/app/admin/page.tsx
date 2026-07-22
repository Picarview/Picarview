'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FileClock,
  FolderOpen,
  Handshake,
  ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { AdminLegalEditor, type AdminLegalPage } from '@/components/AdminLegalEditor'

type AdminView = 'overview' | 'media' | 'projects' | 'partners' | 'drafts' | 'legal' | 'settings'

interface AdminItem {
  id: string
  type: 'partner' | 'project'
  title: string
  subtitle: string
  description: string
  industry: string
  altText: string
  sortOrder: number
  imageUrl: string
  images: Array<{ id: string; imageUrl: string; altText: string }>
  published: boolean
  createdAt: string
}

interface AdminResponse {
  error?: string
  items?: AdminItem[]
  industries?: string[]
}

interface AdminSiteMedia {
  slot: 'hero' | 'expression-1' | 'expression-2' | 'expression-3' | 'expression-4'
  mediaType: 'image' | 'video'
  title: string
  altText: string
  mediaUrl: string
  updatedAt: string
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

function uploadContent(
  formData: FormData,
  onProgress: (progress: number) => void,
  endpoint = '/api/admin/items'
): Promise<AdminResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', endpoint)
    request.responseType = 'json'
    request.timeout = 300_000

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
  const [industries, setIndustries] = useState<string[]>([])
  const [siteMedia, setSiteMedia] = useState<AdminSiteMedia[]>([])
  const [legalPages, setLegalPages] = useState<AdminLegalPage[]>([])
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ open: false, progress: 0, status: 'Preparing upload…' })
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminSiteMedia | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AdminItem['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '365'>('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [visibleCount, setVisibleCount] = useState(6)
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const [selectedProjectFiles, setSelectedProjectFiles] = useState<File[]>([])

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
    setIndustries(Array.isArray(data.industries) ? data.industries : [])
    setAuthenticated(true)
  }, [])

  const loadSiteMedia = useCallback(async () => {
    // Versioned query avoids any stale pre-route 404 cached by an earlier deployment.
    const response = await fetch('/api/admin/site-media?v=1', { cache: 'no-store' })
    if (!response.ok) return
    const data: unknown = await response.json()
    if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data.items)) {
      setSiteMedia(data.items as AdminSiteMedia[])
    }
  }, [])

  const loadLegalPages = useCallback(async () => {
    const response = await fetch('/api/admin/legal', { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json() as { pages?: AdminLegalPage[] }
    setLegalPages(Array.isArray(data.pages) ? data.pages : [])
  }, [])

  useEffect(() => { void Promise.all([loadItems(), loadSiteMedia(), loadLegalPages()]) }, [loadItems, loadSiteMedia, loadLegalPages])
  useEffect(() => { setVisibleCount(6) }, [search, typeFilter, statusFilter, dateFilter, sort])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = dateFilter === 'all' ? 0 : Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000

    return items
      .filter((item) => typeFilter === 'all' || item.type === typeFilter)
      .filter((item) => statusFilter === 'all' || (statusFilter === 'published' ? item.published : !item.published))
      .filter((item) => !cutoff || new Date(`${item.createdAt}Z`).getTime() >= cutoff)
      .filter((item) => !query || `${item.title} ${item.subtitle} ${item.description} ${item.altText}`.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title)
        const difference = new Date(`${b.createdAt}Z`).getTime() - new Date(`${a.createdAt}Z`).getTime()
        return sort === 'newest' ? difference : -difference
      })
  }, [dateFilter, items, search, sort, statusFilter, typeFilter])

  const visibleItems = filteredItems.slice(0, visibleCount)
  const projectCount = items.filter((item) => item.type === 'project').length
  const partnerCount = items.filter((item) => item.type === 'partner').length
  const draftCount = items.filter((item) => !item.published).length
  const publishedCount = items.length - draftCount

  function navigateTo(view: AdminView) {
    setActiveView(view)
    setMobileMoreOpen(false)
    setSearch('')
    if (view === 'projects') {
      setTypeFilter('project')
      setStatusFilter('all')
    } else if (view === 'partners') {
      setTypeFilter('partner')
      setStatusFilter('all')
    } else if (view === 'drafts') {
      setTypeFilter('all')
      setStatusFilter('draft')
    } else {
      setTypeFilter('all')
      setStatusFilter('all')
    }
  }

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
    await Promise.all([loadItems(), loadSiteMedia(), loadLegalPages()])
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setMessage('')
    const formData = new FormData(form)
    const isProject = formData.get('type') === 'project'
    const imageCount = isProject
      ? formData.getAll('images').filter((entry) => entry instanceof File && entry.size > 0).length
      : 1
    setUpload({ open: true, progress: 0, status: imageCount > 1 ? `Preparing ${imageCount} project images…` : 'Preparing upload…' })

    try {
      await uploadContent(formData, (progress) => {
        setUpload({
          open: true,
          progress,
          status: progress >= 92
            ? 'Building the project gallery…'
            : imageCount > 1 ? `Uploading ${imageCount} project images…` : 'Uploading image…',
        })
      })
      setUpload({ open: true, progress: 100, status: imageCount > 1 ? 'Project gallery published successfully' : 'Published successfully' })
      form.reset()
      setSelectedProjectFiles([])
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

  async function updateSiteMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setMessage('')
    setUpload({ open: true, progress: 0, status: 'Preparing media…' })

    try {
      await uploadContent(new FormData(form), (progress) => {
        setUpload({
          open: true,
          progress,
          status: progress >= 92 ? 'Activating website media…' : 'Uploading media…',
        })
      }, '/api/admin/site-media')
      setUpload({ open: true, progress: 100, status: 'Website media updated' })
      form.reset()
      window.setTimeout(() => setUpload((current) => ({ ...current, open: false })), 650)
      void loadSiteMedia()
    } catch (error) {
      setUpload((current) => ({ ...current, open: false }))
      setMessage(error instanceof Error ? error.message : 'Unable to update website media.')
    } finally {
      setBusy(false)
    }
  }

  async function restoreSiteDefault() {
    if (!resetTarget) return
    setBusy(true)
    const response = await fetch(`/api/admin/site-media?slot=${encodeURIComponent(resetTarget.slot)}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) {
      const data = await readAdminResponse(response)
      setMessage(data.error ?? 'Unable to restore the default media.')
      setResetTarget(null)
      return
    }
    setResetTarget(null)
    await loadSiteMedia()
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
            <input name="password" type="password" autoComplete="current-password" maxLength={512} required autoFocus />
          </label>
          <button disabled={busy}>{busy ? 'Checking…' : 'Enter dashboard'}</button>
          {message && <p className="admin-message">{message}</p>}
          <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to website</Link>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell admin-shell--dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand"><span>P</span><div><strong>Picarview®</strong><small>Workspace</small></div></div>
        <nav aria-label="Dashboard navigation">
          <button className={activeView === 'overview' ? 'is-active' : ''} onClick={() => navigateTo('overview')}><LayoutDashboard /> Overview</button>
          <button className={activeView === 'media' ? 'is-active' : ''} onClick={() => navigateTo('media')}><ImageIcon /> Website media <i>{siteMedia.length}/5</i></button>
          <button className={activeView === 'projects' ? 'is-active' : ''} onClick={() => navigateTo('projects')}><FolderOpen /> Projects <i>{projectCount}</i></button>
          <button className={activeView === 'partners' ? 'is-active' : ''} onClick={() => navigateTo('partners')}><Handshake /> Partners <i>{partnerCount}</i></button>
          <button className={activeView === 'drafts' ? 'is-active' : ''} onClick={() => navigateTo('drafts')}><FileClock /> Drafts <i>{draftCount}</i></button>
          <button className={activeView === 'legal' ? 'is-active' : ''} onClick={() => navigateTo('legal')}><FileText /> Legal pages <i>{legalPages.filter((page) => page.published).length}/2</i></button>
          <button className={activeView === 'settings' ? 'is-active' : ''} onClick={() => navigateTo('settings')}><Settings /> Settings</button>
        </nav>
        <div className="admin-sidebar__footer">
          <Link href="/"><ExternalLink /> View website</Link>
          <button onClick={() => void logout()} disabled={signingOut}>
            {signingOut ? <LoaderCircle className="admin-spinner" /> : <LogOut />}
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="admin-dashboard">
        <header className="admin-header">
          <div>
            <p>{activeView === 'overview' ? 'Dashboard overview' : `Manage ${activeView}`}</p>
            <h1>{({
              overview: 'Good to see you.',
              media: 'Website media',
              projects: 'Project library',
              partners: 'Partner library',
              drafts: 'Unpublished work',
              legal: 'Legal documents',
              settings: 'CMS settings',
            } as Record<AdminView, string>)[activeView]}</h1>
          </div>
          <div><span className="admin-live-dot"><i /> Live</span></div>
        </header>
        {message && <div className="admin-global-message"><span>{message}</span><button onClick={() => setMessage('')}><X className="h-4 w-4" /></button></div>}

        {activeView === 'overview' && (
          <>
            <section className="admin-overview-stats">
              {[
                { label: 'All content', value: items.length, color: '#ffb000' },
                { label: 'Published', value: publishedCount, color: '#b9ff32' },
                { label: 'Drafts', value: draftCount, color: '#ff6b8b' },
                { label: 'Media overrides', value: siteMedia.length, color: '#22d9ee' },
              ].map((stat) => (
                <article style={{ backgroundColor: stat.color }} key={stat.label}><span>{stat.label}</span><strong>{String(stat.value).padStart(2, '0')}</strong></article>
              ))}
            </section>
            <section className="admin-overview-grid">
              <div className="admin-overview-panel">
                <header><div><p>Quick actions</p><h2>Keep creating</h2></div></header>
                <div className="admin-quick-actions">
                  <button onClick={() => navigateTo('projects')}><FolderOpen /><span><strong>Add a project</strong><small>Publish new work</small></span></button>
                  <button onClick={() => navigateTo('partners')}><Handshake /><span><strong>Add a partner</strong><small>Upload a new logo</small></span></button>
                  <button onClick={() => navigateTo('media')}><ImageIcon /><span><strong>Change website media</strong><small>Hero and expressions</small></span></button>
                  <button onClick={() => navigateTo('legal')}><FileText /><span><strong>Edit legal pages</strong><small>Privacy and terms</small></span></button>
                </div>
              </div>
              <div className="admin-overview-panel">
                <header><div><p>Latest activity</p><h2>Recent content</h2></div><button onClick={() => navigateTo('projects')}>View library</button></header>
                <div className="admin-recent-list">
                  {items.slice().sort((a, b) => new Date(`${b.createdAt}Z`).getTime() - new Date(`${a.createdAt}Z`).getTime()).slice(0, 5).map((item) => (
                    <article key={item.id}>
                      <div className="admin-recent-list__image"><Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized /></div>
                      <div><span>{item.type} · {item.published ? 'Published' : 'Draft'}</span><strong>{item.title}</strong></div>
                      <time>{new Date(`${item.createdAt}Z`).toLocaleDateString()}</time>
                    </article>
                  ))}
                  {items.length === 0 && <div className="admin-empty">No CMS activity yet.</div>}
                </div>
              </div>
            </section>
          </>
        )}

      {activeView === 'media' && <section className="admin-site-media">
        <header>
          <div><p>Website media</p><h2>Hero + selected expressions</h2></div>
          <span>Original designs remain the automatic fallback</span>
        </header>
        <div className="admin-site-media__grid">
          {([
            { slot: 'hero', name: 'Hero background', accept: 'image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm', note: 'Image ≤10 MB · MP4/WebM ≤40 MB' },
            { slot: 'expression-1', name: 'Expression 01', accept: 'image/png,image/jpeg,image/webp,image/avif', note: 'Image ≤10 MB' },
            { slot: 'expression-2', name: 'Expression 02', accept: 'image/png,image/jpeg,image/webp,image/avif', note: 'Image ≤10 MB' },
            { slot: 'expression-3', name: 'Expression 03', accept: 'image/png,image/jpeg,image/webp,image/avif', note: 'Image ≤10 MB' },
            { slot: 'expression-4', name: 'Expression 04', accept: 'image/png,image/jpeg,image/webp,image/avif', note: 'Image ≤10 MB' },
          ] as const).map((field) => {
            const current = siteMedia.find((item) => item.slot === field.slot)
            return (
              <form className="admin-media-slot" onSubmit={updateSiteMedia} key={field.slot}>
                <input type="hidden" name="slot" value={field.slot} />
                <div className="admin-media-slot__preview">
                  {current?.mediaType === 'video' ? (
                    <video src={current.mediaUrl} muted playsInline preload="metadata" />
                  ) : current ? (
                    <Image src={current.mediaUrl} alt={current.altText} fill sizes="240px" className="object-cover" unoptimized />
                  ) : (
                    <span>Default</span>
                  )}
                </div>
                <div className="admin-media-slot__heading">
                  <div><span>{field.slot}</span><h3>{field.name}</h3></div>
                  {current && <button type="button" onClick={() => setResetTarget(current)} disabled={busy}>Restore default</button>}
                </div>
                <label><span>Accessible description</span><input name="altText" maxLength={300} required /></label>
                <label className="admin-media-slot__file"><span>{field.note}</span><input name="media" type="file" accept={field.accept} required /></label>
                <button disabled={busy}>{busy ? 'Please wait…' : current ? 'Replace media' : 'Upload media'}</button>
              </form>
            )
          })}
        </div>
      </section>}

      {(activeView === 'projects' || activeView === 'partners' || activeView === 'drafts') && <section className={`admin-layout ${activeView === 'drafts' ? 'admin-layout--library-only' : ''}`}>
        {activeView !== 'drafts' && (
        <form className="admin-create" onSubmit={createItem}>
          <header><Plus className="h-5 w-5" /><h2>Add {activeView === 'partners' ? 'partner' : 'project'}</h2></header>
          <input type="hidden" name="type" value={activeView === 'partners' ? 'partner' : 'project'} />
          <label><span>Title</span><input name="title" placeholder="Project or partner name" maxLength={120} required /></label>
          <label><span>Subtitle</span><input name="subtitle" placeholder="Identity, campaign, industry…" maxLength={200} /></label>
          {activeView === 'projects' && (
            <>
              <label>
                <span>Industry</span>
                <input name="industry" list="project-industries" placeholder="Choose or type a new industry" maxLength={80} required />
                <small>Choose an existing industry or type a new one to create it.</small>
              </label>
              <datalist id="project-industries">{industries.map((industry) => <option value={industry} key={industry} />)}</datalist>
              <label><span>Project description</span><textarea name="description" placeholder="The idea, approach, and outcome of the project…" maxLength={1500} rows={5} /></label>
            </>
          )}
          <label><span>Image description</span><input name="altText" placeholder="Accessible description" maxLength={300} required /></label>
          <label><span>Status</span>
            <select name="published" defaultValue="true"><option value="true">Published</option><option value="false">Draft</option></select>
          </label>
          {activeView === 'projects' ? (
            <label className="admin-upload admin-upload--gallery">
              <span>Project gallery · up to 8 images</span>
              <input
                name="images"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                multiple
                required
                onChange={(event) => setSelectedProjectFiles(Array.from(event.target.files ?? []).slice(0, 8))}
              />
              <small>The first image becomes the project cover. Each image can be up to 10 MB; combined gallery maximum is 48 MB.</small>
              {selectedProjectFiles.length > 0 && (
                <ol className="admin-upload__selection">
                  {selectedProjectFiles.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}`}>
                      <strong>{index === 0 ? 'Cover' : String(index + 1).padStart(2, '0')}</strong>
                      <span>{file.name}</span>
                      <i>{(file.size / 1024 / 1024).toFixed(1)} MB</i>
                    </li>
                  ))}
                </ol>
              )}
            </label>
          ) : (
            <label className="admin-upload"><span>Partner logo · max 10 MB</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required /></label>
          )}
          <button disabled={busy}>{busy ? 'Working…' : 'Upload and save'}</button>
        </form>
        )}

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
            {activeView === 'drafts' && <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} aria-label="Filter by content type">
              <option value="all">All content</option>
              <option value="project">Projects</option>
              <option value="partner">Partners</option>
            </select>}
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
                      {item.type === 'project' && item.images.length > 1 && <span className="admin-item__media-count">{item.images.length} images</span>}
                    </div>
                    <div>
                      <span>{item.type} · {item.published ? 'Published' : 'Draft'}</span>
                      <h3>{item.title}</h3>
                      <p>{item.type === 'project' && item.industry ? `${item.industry} · ` : ''}{item.subtitle || 'No subtitle'} · {new Date(`${item.createdAt}Z`).toLocaleDateString()}</p>
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
      </section>}

      {activeView === 'settings' && (
        <section className="admin-settings-grid">
          <article><span>Security</span><h2>Protected admin</h2><p>Signed 12-hour sessions, strict same-origin requests, rate-limited login attempts, timing-safe comparisons, CSP, and validated uploads are active.</p><strong>Security layers online</strong></article>
          <article><span>Cloudflare</span><h2>Storage bindings</h2><p>Content metadata is stored in D1. Images and videos are stored in R2 and served through protected application routes.</p><strong>CMS_DB · CMS_MEDIA</strong></article>
          <article><span>Website defaults</span><h2>Fallback system</h2><p>Removing CMS media restores the repository hero sequence and original expression images. Empty content never creates a blank section.</p><button onClick={() => navigateTo('media')}>Manage website media</button></article>
          <article><span>Production</span><h2>Live Worker</h2><p>The active Cloudflare Worker is <strong>picarview-landing</strong>. GitHub pushes and Cloudflare deployments remain separate release steps.</p><Link href="/">Open live website <ExternalLink className="h-4 w-4" /></Link></article>
        </section>
      )}

      {activeView === 'legal' && <AdminLegalEditor pages={legalPages} onSaved={loadLegalPages} />}
      </div>

      <nav className="admin-mobile-nav" aria-label="Mobile dashboard navigation">
        <button className={activeView === 'overview' ? 'is-active' : ''} onClick={() => navigateTo('overview')}><LayoutDashboard /><span>Home</span></button>
        <button className={activeView === 'media' ? 'is-active' : ''} onClick={() => navigateTo('media')}><ImageIcon /><span>Media</span></button>
        <button className={activeView === 'projects' ? 'is-active' : ''} onClick={() => navigateTo('projects')}><FolderOpen /><span>Projects</span></button>
        <button className={activeView === 'partners' ? 'is-active' : ''} onClick={() => navigateTo('partners')}><Handshake /><span>Partners</span></button>
        <button className={mobileMoreOpen ? 'is-active' : ''} onClick={() => setMobileMoreOpen((open) => !open)}><Menu /><span>More</span></button>
      </nav>

      {mobileMoreOpen && (
        <div className="admin-mobile-drawer">
          <button className="admin-mobile-drawer__close" onClick={() => setMobileMoreOpen(false)}><X /></button>
          <span>More controls</span>
          <button onClick={() => navigateTo('drafts')}><FileClock /> Drafts <i>{draftCount}</i></button>
          <button onClick={() => navigateTo('legal')}><FileText /> Legal pages</button>
          <button onClick={() => navigateTo('settings')}><Settings /> Settings</button>
          <Link href="/"><ExternalLink /> View website</Link>
          <button onClick={() => void logout()} disabled={signingOut}>{signingOut ? <LoaderCircle className="admin-spinner" /> : <LogOut />} Sign out</button>
        </div>
      )}

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

      {resetTarget && (
        <div className="admin-delete-modal" role="dialog" aria-modal="true" aria-labelledby="reset-media-title">
          <div className="admin-delete-card admin-delete-card--cyan">
            <button className="admin-delete-card__close" onClick={() => setResetTarget(null)} disabled={busy} aria-label="Close restore dialog">
              <X className="h-5 w-5" />
            </button>
            <span>Website media</span>
            <h2 id="reset-media-title">Restore original?</h2>
            <p>The uploaded media for <strong>{resetTarget.slot}</strong> will be removed and the original Picarview design will return immediately.</p>
            <div className="admin-delete-card__actions">
              <button onClick={() => setResetTarget(null)} disabled={busy}>Keep current</button>
              <button onClick={() => void restoreSiteDefault()} disabled={busy}>
                {busy ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                {busy ? 'Restoring…' : 'Restore original'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
