import type { Plugin, ResolvedConfig } from 'vite'
import MagicString from 'magic-string'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'

export interface WebAwesomeOptions {
  styles?: boolean
}

type PluginTransformResult = {
  code: string
  map: ReturnType<MagicString['generateMap']>
  moduleType?: string
}

const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'])
const VUE_SVELTE_EXTENSIONS = new Set(['.vue', '.svelte'])

function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
}

function extractTags(src: string): Set<string> {
  const stripped = stripComments(src)
  const tags = new Set<string>()
  const regex = /<(wa-[a-z0-9-]+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(stripped)) !== null) {
    tags.add(match[1])
  }
  return tags
}

function tagToImport(tag: string): string {
  const name = tag.slice(3)
  return `import '@awesome.me/webawesome/dist/components/${name}/${name}.js'`
}

function resolveEntryFromHtml(root: string): string | null {
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

export function webawesome(options: WebAwesomeOptions = {}): Plugin {
  let entryFilePath: string | null = null

  return {
    name: 'vite-plugin-webawesome',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      if (!options.styles) return

      const rolldownInput = (config.build as any).rolldownOptions?.input
      if (rolldownInput) {
        const raw = typeof rolldownInput === 'string'
          ? rolldownInput
          : (Object.values(rolldownInput)[0] as string)
        entryFilePath = resolve(config.root, raw)
        return
      }

      entryFilePath = resolveEntryFromHtml(config.root)
    },

    transform(src: string, id: string) {
      const ext = extname(id.split('?')[0])
      if (!ALLOWED_EXTENSIONS.has(ext)) return null
      if (id.includes('node_modules')) return null

      const isEntry = options.styles && entryFilePath !== null && id === entryFilePath
      if (!src.includes('wa-') && !isEntry) return null

      const tags = src.includes('wa-') ? extractTags(src) : new Set<string>()
      const isVueSvelte = VUE_SVELTE_EXTENSIONS.has(ext)

      const imports: string[] = []

      if (isEntry) {
        imports.push(`import '@awesome.me/webawesome/dist/styles/webawesome.css'`)
      }

      for (const tag of tags) {
        imports.push(tagToImport(tag))
      }

      if (imports.length === 0) return null

      const s = new MagicString(src)
      s.prepend(imports.join('\n') + '\n')

      const result: PluginTransformResult = {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      }

      if (isVueSvelte) {
        result.moduleType = 'js'
      }

      return result
    },
  }
}

export default webawesome
