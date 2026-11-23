import { CASE_STUDY_COLUMNS, getCmsEnv, publicCmsItem, type CmsItem, type CmsProjectImage } from '@/lib/cloudflare-cms'

export type PublicContentItem = ReturnType<typeof publicCmsItem> & {
  images: Array<{ id: string; imageUrl: string; altText: string; sortOrder: number }>
}

/**
 * Published, non-archived CMS items of one type, with project galleries attached.
 * Returns null when the CMS database isn't configured.
 */
export async function listPublishedContent(type: 'partner' | 'project'): Promise<PublicContentItem[] | null> {
  const { CMS_DB } = getCmsEnv()
  if (!CMS_DB) return null

  const query = await CMS_DB.prepare(
    `SELECT id, type, title, subtitle, description, industry, alt_text, object_key, sort_order, published, archived, pinned, created_at,
       ${CASE_STUDY_COLUMNS}
     FROM content_items
     WHERE type = ? AND published = 1 AND archived = 0
     ORDER BY pinned DESC, sort_order ASC, created_at DESC`
  ).bind(type).all<CmsItem>()

  const imageQuery = type === 'project'
    ? await CMS_DB.prepare(
        `SELECT pi.id, pi.project_id, pi.object_key, pi.alt_text, pi.sort_order, pi.created_at
         FROM project_images pi
         INNER JOIN content_items ci ON ci.id = pi.project_id
         WHERE ci.type = 'project' AND ci.published = 1 AND ci.archived = 0
         ORDER BY pi.sort_order ASC, pi.created_at ASC`
      ).all<CmsProjectImage>()
    : { results: [] as CmsProjectImage[], success: true }

  const imagesByProject = new Map<string, PublicContentItem['images']>()
  for (const image of imageQuery.results ?? []) {
    const images = imagesByProject.get(image.project_id) ?? []
    images.push({
      id: image.id,
      imageUrl: `/api/cms/media?key=${encodeURIComponent(image.object_key)}`,
      altText: image.alt_text,
      sortOrder: image.sort_order,
    })
    imagesByProject.set(image.project_id, images)
  }

  return (query.results ?? []).map((item) => ({
    ...publicCmsItem(item),
    images: imagesByProject.get(item.id) ?? [],
  }))
}
