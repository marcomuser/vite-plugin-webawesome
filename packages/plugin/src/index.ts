import type { Plugin, ResolvedConfig } from 'vite'
import MagicString from 'magic-string'
import { extname, resolve } from 'node:path'
import { stripComments, extractTags, tagToImport, resolveEntryFromHtml } from './utils.ts'

export interface WebAwesomeOptions {
  styles?: boolean
}

const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'])
const VUE_SVELTE_EXTENSIONS = new Set(['.vue', '.svelte'])

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

      if (isVueSvelte) {
        const scriptMatch = src.match(/<script\b[^>]*>/)
        if (scriptMatch && scriptMatch.index !== undefined) {
          s.prependLeft(scriptMatch.index + scriptMatch[0].length, '\n' + imports.join('\n'))
        } else {
          s.prepend('<script>\n' + imports.join('\n') + '\n</script>\n')
        }
      } else {
        s.prepend(imports.join('\n') + '\n')
      }

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      }
    },
  }
}

export default webawesome
