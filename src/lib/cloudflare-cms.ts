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
  size: number
  httpMetadata?: { contentType?: string; cacheControl?: string }
}

interface CmsBucket {
  put(key: string, value: ArrayBuffer, options?: {
    httpMetadata?: { contentType?: string; cacheControl?: string }
  }): Promise<unknown>
  get(key: string, options?: { range?: { offset: number; length?: number } }): Promise<CmsObject | null>
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
  description: string
  industry: string
  alt_text: string
  object_key: string
  sort_order: number
  published: number
  archived: number
  pinned: number
  created_at: string
}

export interface CmsProjectImage {
  id: string
  project_id: string
  object_key: string
  alt_text: string
  sort_order: number
  created_at: string
}

export interface CmsSiteMedia {
  slot: 'hero' | 'expression-1' | 'expression-2' | 'expression-3' | 'expression-4'
  media_type: 'image' | 'video'
  title: string
  alt_text: string
  object_key: string
  mime_type: string
  updated_at: string
}

export interface CmsLegalPage {
  slug: string
  title: string
  introduction: string
  sections_json: string
  effective_date: string
  published: number
  updated_at: string
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
    description: item.description,
    industry: item.industry,
    altText: item.alt_text,
    sortOrder: item.sort_order,
    createdAt: item.created_at,
    imageUrl: `/api/cms/media?key=${encodeURIComponent(item.object_key)}`,
  }
}

export const SESSION_COOKIE = 'picarview_admin'
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const ADMIN_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000
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

export async function timingSafeTextEqual(value: string, expected: string) {
  // Compare fixed-length hashes so this works in both Cloudflare workerd and
  // local Node.js, whose Web Crypto implementation has no timingSafeEqual().
  const [valueHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(value)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const valueBytes = new Uint8Array(valueHash)
  const expectedBytes = new Uint8Array(expectedHash)
  let difference = 0
  for (let index = 0; index < valueBytes.length; index += 1) {
    difference |= valueBytes[index] ^ expectedBytes[index]
  }
  return difference === 0
}

interface AdminSession {
  absoluteExpires: number
  idleExpires: number
}

export async function createAdminSession(secret: string, absoluteExpires = Date.now() + ADMIN_ABSOLUTE_TIMEOUT_MS) {
  const idleExpires = Math.min(absoluteExpires, Date.now() + ADMIN_IDLE_TIMEOUT_MS)
  const payload = `${absoluteExpires}.${idleExpires}`
  return `${payload}.${await sign(payload, secret)}`
}

export async function readAdminSession(token: string | undefined, secret: string | undefined): Promise<AdminSession | null> {
  if (!token || !secret) return null
  const [absoluteValue, idleValue, signature] = token.split('.')
  const absoluteExpires = Number(absoluteValue)
  const idleExpires = Number(idleValue)
  const now = Date.now()
  if (
    !absoluteValue || !idleValue || !signature ||
    !Number.isFinite(absoluteExpires) || !Number.isFinite(idleExpires) ||
    absoluteExpires < now || idleExpires < now || idleExpires > absoluteExpires
  ) return null
  const payload = `${absoluteValue}.${idleValue}`
  if (!await timingSafeTextEqual(signature, await sign(payload, secret))) return null
  return { absoluteExpires, idleExpires }
}

export async function verifyAdminSession(token: string | undefined, secret: string | undefined) {
  return Boolean(await readAdminSession(token, secret))
}

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.get('cookie') ?? ''
  return cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')
  if (!origin || (fetchSite && fetchSite !== 'same-origin')) return false

  const requestUrl = new URL(request.url)
  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return false
  }
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') return false

  const allowedOrigins = new Set([requestUrl.origin])
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const directHost = request.headers.get('host')?.trim()
  const host = forwardedHost || directHost
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProtocol === 'http' || forwardedProtocol === 'https'
    ? forwardedProtocol
    : requestUrl.protocol.slice(0, -1)

  // Reverse proxies such as GitHub Codespaces terminate HTTPS before forwarding
  // the request to the local Next.js server. Trust only a syntactically valid host
  // supplied for this request, and still require the browser's same-origin signal.
  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    allowedOrigins.add(`${protocol}://${host}`)
  }

  return allowedOrigins.has(origin)
    || originUrl.host === forwardedHost
    || originUrl.host === directHost
}

export function safeImageType(file: File) {
  return ['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type)
}

export function safeImageBytes(bytes: Uint8Array, type: string) {
  if (type === 'image/png') {
    return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes[index] === byte)
  }
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (type === 'image/webp') {
    return bytes.length >= 12
      && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF'
      && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP'
  }
  if (type === 'image/avif') {
    if (bytes.length < 12 || new TextDecoder().decode(bytes.subarray(4, 8)) !== 'ftyp') return false
    const brand = new TextDecoder().decode(bytes.subarray(8, Math.min(bytes.length, 32)))
    return brand.includes('avif') || brand.includes('avis')
  }
  return false
}

export function safeVideoType(file: File) {
  return ['video/mp4', 'video/webm'].includes(file.type)
}

export function safeVideoBytes(bytes: Uint8Array, type: string) {
  if (type === 'video/mp4') {
    return bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(4, 8)) === 'ftyp'
  }
  if (type === 'video/webm') {
    return bytes.length >= 4
      && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
  }
  return false
}

export function extensionFor(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension || ({ 'image/jpeg': 'jpg' }[file.type] ?? file.type.split('/')[1] ?? 'bin')
}
