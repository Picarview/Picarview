import { projects as showcaseProjects, projectFromCms, type Project } from '@/data/projects'
import { listPublishedContent } from '@/lib/cms-content'

/**
 * The projects shown on the site: CMS projects when any are published,
 * otherwise the built-in showcase set. CMS gaps are filled with placeholder copy.
 */
export async function getSiteProjects(): Promise<Project[]> {
  try {
    const items = await listPublishedContent('project')
    if (items?.length) return items.map(projectFromCms)
  } catch (error) {
    console.warn('CMS project query failed; using showcase projects', error)
  }
  return showcaseProjects
}
