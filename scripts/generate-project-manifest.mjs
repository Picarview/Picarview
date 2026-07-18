import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const imagesDirectory = join(projectRoot, 'public', 'images')
const manifestPath = join(projectRoot, 'src', 'generated', 'project-images.json')

const projects = readdirSync(imagesDirectory)
  .filter((file) => /^work\d+\.(avif|jpe?g|png|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => `/images/${file}`)

mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, `${JSON.stringify(projects, null, 2)}\n`)

console.log(`Generated project manifest with ${projects.length} images.`)
