import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { HookHandler, Plugin, ResolvedConfig } from 'vite'
import { webawesome } from '../src/index.ts'

type ConfigResolvedFn = HookHandler<NonNullable<Plugin['configResolved']>>
type TransformFn = HookHandler<NonNullable<Plugin['transform']>>

function callConfigResolved(plugin: ReturnType<typeof webawesome>, config: ResolvedConfig): void {
  (plugin.configResolved as OmitThisParameter<ConfigResolvedFn>)(config)
}

function callTransform(plugin: ReturnType<typeof webawesome>, src: string, id: string) {
  return (plugin.transform as OmitThisParameter<TransformFn>)(src, id) as {
    code: string
    map: unknown
    moduleType?: string
  } | null
}

describe('styles-injection', () => {
  it('webawesome() with no options → no CSS import on any file', () => {
    const plugin = webawesome()
    callConfigResolved(plugin, { root: '/app', build: {} } as ResolvedConfig)
    const result = callTransform(plugin, '<wa-button />', '/app/src/main.tsx')
    assert.ok(result)
    assert.ok(!result.code.includes('webawesome.css'))
  })

  it('styles: true → CSS import prepended to entry file', () => {
    const plugin = webawesome({ styles: true })
    callConfigResolved(plugin, {
      root: '/app',
      build: { rolldownOptions: { input: 'src/main.tsx' } },
    } as ResolvedConfig)
    const result = callTransform(plugin, '<wa-button />', '/app/src/main.tsx')
    assert.ok(result)
    assert.ok(result.code.startsWith("import '@awesome.me/webawesome/dist/styles/webawesome.css'"))
  })

  it('styles: true + non-entry file → no CSS import', () => {
    const plugin = webawesome({ styles: true })
    callConfigResolved(plugin, {
      root: '/app',
      build: { rolldownOptions: { input: 'src/main.tsx' } },
    } as ResolvedConfig)
    const result = callTransform(plugin, '<wa-button />', '/app/src/Comp.tsx')
    assert.ok(result)
    assert.ok(!result.code.includes('webawesome.css'))
  })

  it('entry resolved from config.build.rolldownOptions.input', () => {
    const plugin = webawesome({ styles: true })
    callConfigResolved(plugin, {
      root: '/app',
      build: { rolldownOptions: { input: 'src/main.tsx' } },
    } as ResolvedConfig)
    const result = callTransform(plugin, '', '/app/src/main.tsx')
    assert.ok(result)
    assert.ok(result.code.includes('webawesome.css'))
  })

  it('entry file ID with HMR timestamp query still receives CSS import', () => {
    const plugin = webawesome({ styles: true })
    callConfigResolved(plugin, {
      root: '/app',
      build: { rolldownOptions: { input: 'src/main.tsx' } },
    } as ResolvedConfig)
    const result = callTransform(plugin, '', '/app/src/main.tsx?t=1749293012345')
    assert.ok(result)
    assert.ok(result.code.includes('webawesome.css'))
  })

  it('non-entry file ID with HMR timestamp query does NOT receive CSS import', () => {
    const plugin = webawesome({ styles: true })
    callConfigResolved(plugin, {
      root: '/app',
      build: { rolldownOptions: { input: 'src/main.tsx' } },
    } as ResolvedConfig)
    const result = callTransform(plugin, '<wa-button />', '/app/src/Comp.tsx?t=1749293012345')
    assert.ok(result)
    assert.ok(!result.code.includes('webawesome.css'))
  })

  describe('entry falls back to index.html', () => {
    let tmpRoot: string

    before(() => {
      tmpRoot = mkdtempSync(join(tmpdir(), 'wa-test-'))
      writeFileSync(
        join(tmpRoot, 'index.html'),
        '<script type="module" src="/src/main.tsx"></script>',
      )
    })

    after(() => {
      rmSync(tmpRoot, { recursive: true })
    })

    it('resolves entry from index.html — CSS injected into resolved entry', () => {
      const plugin = webawesome({ styles: true })
      callConfigResolved(plugin, { root: tmpRoot, build: {} } as ResolvedConfig)
      const entryId = join(tmpRoot, 'src/main.tsx')
      const result = callTransform(plugin, '', entryId)
      assert.ok(result)
      assert.ok(result.code.includes('webawesome.css'))
    })

    it('index.html with src before type is matched', () => {
      writeFileSync(
        join(tmpRoot, 'index.html'),
        '<script src="/src/main.tsx" type="module"></script>',
      )
      const plugin = webawesome({ styles: true })
      callConfigResolved(plugin, { root: tmpRoot, build: {} } as ResolvedConfig)
      const entryId = join(tmpRoot, 'src/main.tsx')
      const result = callTransform(plugin, '', entryId)
      assert.ok(result)
      assert.ok(result.code.includes('webawesome.css'))
    })
  })
})
