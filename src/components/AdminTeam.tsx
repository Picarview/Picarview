'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'

interface AdminTeamMember {
  id: string
  name: string
  role: string
  altText: string
  sortOrder: number
  photoUrl: string
  published: boolean
}

async function readJson(response: Response): Promise<{ error?: string; members?: AdminTeamMember[] }> {
  try {
    const data: unknown = await response.json()
    return typeof data === 'object' && data !== null ? data as { error?: string; members?: AdminTeamMember[] } : {}
  } catch {
    return {}
  }
}

/**
 * Admin → Team: add, edit, reorder, publish and delete the people shown on
 * /about#the-team. Until anyone is published there, the site shows role placeholders.
 */
export function AdminTeam({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [members, setMembers] = useState<AdminTeamMember[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editTarget, setEditTarget] = useState<AdminTeamMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminTeamMember | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/team', { cache: 'no-store' })
    const data = await readJson(response)
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to load the team. Has the team database migration been applied?')
      return
    }
    const next = Array.isArray(data.members) ? data.members : []
    setMembers(next)
    onCountChange?.(next.length)
  }, [onCountChange])

  // Initial load: state is only set after the awaited fetch, not synchronously.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  async function send(init: RequestInit, success: string, failure: string, url = '/api/admin/team') {
    setBusy(true)
    setMessage('')
    const response = await fetch(url, init)
    const data = await readJson(response)
    setBusy(false)
    if (!response.ok) {
      setMessage(data.error ?? failure)
      return false
    }
    setMessage(success)
    await load()
    return true
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (await send({ method: 'POST', body: new FormData(form) }, 'Team member added.', 'Unable to add team member.')) form.reset()
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTarget) return
    const form = new FormData(event.currentTarget)
    form.set('id', editTarget.id)
    if (await send({ method: 'PATCH', body: form }, `${String(form.get('name'))} updated.`, 'Unable to update team member.')) setEditTarget(null)
  }

  const action = (member: AdminTeamMember, name: string, success: string) =>
    send(
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: member.id, action: name }) },
      success,
      'Unable to update team member.'
    )

  async function remove() {
    if (!deleteTarget) return
    const target = deleteTarget
    await send({ method: 'DELETE' }, `${target.name} removed.`, 'Unable to delete team member.', `/api/admin/team?id=${encodeURIComponent(target.id)}`)
    setDeleteTarget(null)
  }

  return (
    <section className="admin-layout">
      <form className="admin-create" onSubmit={create}>
        <header><Plus className="h-5 w-5" /><h2>Add team member</h2></header>
        <label><span>Name</span><input name="name" placeholder="Full name" maxLength={80} required /></label>
        <label><span>Role</span><input name="role" placeholder="Art Director" maxLength={120} required /></label>
        <label><span>Photo description</span><input name="altText" placeholder="Portrait of …" maxLength={300} /></label>
        <label><span>Status</span>
          <select name="published" defaultValue="true"><option value="true">Published</option><option value="false">Hidden</option></select>
        </label>
        <label className="admin-upload">
          <span>Portrait · optional · square works best · max 10 MB</span>
          <input name="photo" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
        </label>
        <button disabled={busy}>{busy ? 'Working…' : 'Add to team'}</button>
        {message && <p className="admin-message">{message}</p>}
      </form>

      <div className="admin-library">
        <header>
          <div><p>The team</p><h2>{members.length} {members.length === 1 ? 'person' : 'people'}</h2></div>
          <span>Shown in this order on the studio page</span>
        </header>
        {members.length === 0 ? (
          <div className="admin-empty">No team members yet. The studio page shows role placeholders until you add people here.</div>
        ) : (
          <div className="admin-items">
            {members.map((member, index) => (
              <article className="admin-item" key={member.id}>
                <div className="admin-item__image">
                  {member.photoUrl
                    ? <Image src={member.photoUrl} alt={member.altText} fill sizes="120px" className="object-cover" unoptimized />
                    : <span className="admin-team__placeholder"><UserRound /></span>}
                </div>
                <div>
                  <span>{String(index + 1).padStart(2, '0')} · {member.published ? 'Published' : 'Hidden'}</span>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
                <div className="admin-item__actions">
                  <button onClick={() => void action(member, 'move-up', 'Order updated.')} disabled={busy || index === 0} aria-label={`Move ${member.name} up`}><ArrowUp className="h-4 w-4" /> Up</button>
                  <button onClick={() => void action(member, 'move-down', 'Order updated.')} disabled={busy || index === members.length - 1} aria-label={`Move ${member.name} down`}><ArrowDown className="h-4 w-4" /> Down</button>
                  {member.published
                    ? <button onClick={() => void action(member, 'unpublish', `${member.name} hidden.`)} disabled={busy}>Hide</button>
                    : <button className="is-publish" onClick={() => void action(member, 'publish', `${member.name} published.`)} disabled={busy}>Publish now</button>}
                  <button onClick={() => setEditTarget(member)} disabled={busy}><Pencil className="h-4 w-4" /> Edit</button>
                  <button className="is-danger" onClick={() => setDeleteTarget(member)} disabled={busy}><Trash2 className="h-4 w-4" /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editTarget && (
        <div className="admin-delete-modal" role="dialog" aria-modal="true" aria-labelledby="edit-member-title">
          <form className="admin-edit-card" onSubmit={update} data-lenis-prevent>
            <button className="admin-delete-card__close" type="button" onClick={() => setEditTarget(null)} disabled={busy} aria-label="Close editor"><X className="h-5 w-5" /></button>
            <span>Team member</span>
            <h2 id="edit-member-title">Edit {editTarget.name}</h2>
            <div className="admin-edit-card__fields">
              <label><span>Name</span><input name="name" defaultValue={editTarget.name} maxLength={80} required /></label>
              <label><span>Role</span><input name="role" defaultValue={editTarget.role} maxLength={120} required /></label>
              <label><span>Photo description</span><input name="altText" defaultValue={editTarget.altText} maxLength={300} /></label>
              <label><span>Status</span>
                <select name="published" defaultValue={String(editTarget.published)}><option value="true">Published</option><option value="false">Hidden</option></select>
              </label>
              <label className="admin-edit-card__wide">
                <span>{editTarget.photoUrl ? 'Replace portrait' : 'Add portrait'} · optional · max 10 MB</span>
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
              </label>
              {editTarget.photoUrl && (
                <button
                  type="button"
                  className="admin-edit-card__wide"
                  disabled={busy}
                  onClick={() => void action(editTarget, 'remove-photo', 'Portrait removed.').then((ok) => ok && setEditTarget(null))}
                >
                  Remove current portrait
                </button>
              )}
            </div>
            <div className="admin-delete-card__actions">
              <button type="button" onClick={() => setEditTarget(null)} disabled={busy}>Cancel</button>
              <button disabled={busy}>{busy ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <Pencil className="h-4 w-4" />}{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-member-title">
          <div className="admin-delete-card">
            <button className="admin-delete-card__close" onClick={() => setDeleteTarget(null)} disabled={busy} aria-label="Close deletion dialog"><X className="h-5 w-5" /></button>
            <span>Permanent action</span>
            <h2 id="delete-member-title">Remove {deleteTarget.name}?</h2>
            <p>Their profile and portrait will be permanently removed from the studio page. This cannot be undone.</p>
            <div className="admin-delete-card__actions">
              <button onClick={() => setDeleteTarget(null)} disabled={busy}>Keep</button>
              <button onClick={() => void remove()} disabled={busy}>
                {busy ? <LoaderCircle className="admin-spinner h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                {busy ? 'Removing…' : 'Remove permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
