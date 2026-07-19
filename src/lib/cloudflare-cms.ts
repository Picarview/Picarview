import { getCloudflareContext } from '@opennextjs/cloudflare'

interface D1Result<T> {
  results?: T[]
  success: boolean
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T>(): Promise<D1Result<T>>
  first<T>(): Promise<T | null>
  run(): Promise<unknown>
}

interface CmsDatabase {
  prepare(query: string): D1Statement
}

interface CmsObject {
  body: ReadableStream
  httpEtag: string
  httpMetadata?: { contentType?: string; cacheControl?: string }
}

interface CmsBucket {
  put(key: string, value: ArrayBuffer, options?: {
    httpMetadata?: { contentType?: string; cacheControl?: string }
  }): Promise<unknown>
  get(key: string): Promise<CmsObject | null>
  delete(key: string): Promise<void>
}

export interface CmsEnv {
  CMS_DB?: CmsDatabase
  CMS_MEDIA?: CmsBucket
  ADMIN_PASSWORD?: string
  ADMIN_SESSION_SECRET?: string
}

export interface CmsItem {
  id: string
  type: 'partner' | 'project'
  title: string
  subtitle: string
  alt_text: string
  object_key: string
  sort_order: number
  published: number
  created_at: string
}

export function getCmsEnv(): CmsEnv {
  return getCloudflareContext().env as unknown as CmsEnv
}

export function publicCmsItem(item: CmsItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    altText: item.alt_text,
    sortOrder: item.sort_order,
    imageUrl: `/api/cms/media?key=${encodeURIComponent(item.object_key)}`,
  }
}

export const SESSION_COOKIE = 'picarview_admin'
const encoder = new TextEncoder()

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

export async function createAdminSession(secret: string) {
  const expires = Date.now() + 1000 * 60 * 60 * 12
  const payload = String(expires)
  return `${payload}.${await sign(payload, secret)}`
}

export async function verifyAdminSession(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature || Number(payload) < Date.now()) return false
  return signature === await sign(payload, secret)
}

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.get('cookie') ?? ''
  return cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export function safeImageType(file: File) {
  return ['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type)
}

export function extensionFor(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension || ({ 'image/jpeg': 'jpg' }[file.type] ?? file.type.split('/')[1] ?? 'bin')
}
