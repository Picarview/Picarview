import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const heroDirectory = join(projectRoot, 'public', 'hero')
const manifestPath = join(projectRoot, 'src', 'generated', 'hero-frames.json')

const frames = readdirSync(heroDirectory)
  .filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => `/hero/${file}`)

if (frames.length === 0) {
  throw new Error(`No hero frames found in ${heroDirectory}`)
}

mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, `${JSON.stringify(frames, null, 2)}\n`)

console.log(`Generated hero manifest with ${frames.length} frames.`)
