import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
}

export function extractTags(src: string): Set<string> {
  const stripped = stripComments(src)
  const tags = new Set<string>()
  const regex = /<(wa-[a-z0-9-]+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(stripped)) !== null) {
    tags.add(match[1])
  }
  return tags
}

export function tagToImport(tag: string): string {
  const name = tag.slice(3)
  return `import '@awesome.me/webawesome/dist/components/${name}/${name}.js'`
}

export function resolveEntryFromHtml(root: string): string | null {
  try {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)
    if (match) {
      return resolve(root, match[1].replace(/^\//, ''))
    }
  } catch {
    // index.html not found or unreadable
  }
  return null
}
