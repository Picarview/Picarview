import { getCmsEnv } from '@/lib/cloudflare-cms'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')
  if (!key || key.includes('..') || !/^(partners|projects)\/[a-zA-Z0-9._-]+$/.test(key)) {
    return new Response('Invalid media key.', { status: 400 })
  }

  const { CMS_MEDIA } = getCmsEnv()
  if (!CMS_MEDIA) return new Response('Media storage is not configured.', { status: 503 })

  const object = await CMS_MEDIA.get(key)
  if (!object) return new Response('Not found.', { status: 404 })

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': object.httpMetadata?.cacheControl ?? 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
    },
  })
}
