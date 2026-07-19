import { getCmsEnv } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')
  if (!key || key.includes('..') || !/^(?:(?:partners|projects)\/[a-zA-Z0-9._-]+|site\/(?:hero|expression-[1-4])\/[a-zA-Z0-9._-]+)$/.test(key)) {
    return new Response('Invalid media key.', { status: 400 })
  }

  const { CMS_MEDIA } = getCmsEnv()
  if (!CMS_MEDIA) return new Response('Media storage is not configured.', { status: 503 })

  const rangeHeader = request.headers.get('range')
  const rangeMatch = rangeHeader?.match(/^bytes=(\d+)-(\d*)$/)
  const start = rangeMatch ? Number(rangeMatch[1]) : undefined
  const requestedEnd = rangeMatch?.[2] ? Number(rangeMatch[2]) : undefined
  if (rangeHeader && (!rangeMatch || !Number.isSafeInteger(start) || (requestedEnd !== undefined && requestedEnd < (start ?? 0)))) {
    return new Response('Invalid range.', { status: 416 })
  }

  const object = await CMS_MEDIA.get(
    key,
    start === undefined
      ? undefined
      : { range: { offset: start, ...(requestedEnd === undefined ? {} : { length: requestedEnd - start + 1 }) } }
  )
  if (!object) return new Response('Not found.', { status: 404 })

  const isPartial = start !== undefined
  const responseLength = isPartial
    ? Math.max(0, Math.min(requestedEnd ?? object.size - 1, object.size - 1) - start + 1)
    : object.size
  if (isPartial && (start >= object.size || responseLength <= 0)) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${object.size}` } })
  }

  return new Response(object.body, {
    status: isPartial ? 206 : 200,
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': object.httpMetadata?.cacheControl ?? 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(responseLength),
      ...(isPartial ? { 'Content-Range': `bytes ${start}-${start + responseLength - 1}/${object.size}` } : {}),
      ETag: object.httpEtag,
    },
  })
}
