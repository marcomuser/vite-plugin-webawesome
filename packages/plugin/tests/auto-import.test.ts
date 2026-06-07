import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { webawesome } from '../src/index.ts'

type TransformResult = { code: string; map: unknown; moduleType?: string } | null

const plugin = webawesome()

function transform(src: string, id: string): TransformResult {
  return (plugin.transform as (src: string, id: string) => TransformResult).call({}, src, id)
}

describe('auto-import', () => {
  it('single <wa-button> → correct import prepended', () => {
    const result = transform('<wa-button />', '/app/src/Comp.tsx')
    assert.ok(result)
    assert.ok(result.code.startsWith("import '@awesome.me/webawesome/dist/components/button/button.js'"))
  })

  it('multiple distinct tags → one import each', () => {
    const result = transform('<wa-button><wa-icon /></wa-button>', '/app/src/Comp.tsx')
    assert.ok(result)
    const importLines = result.code.split('\n').filter(l => l.startsWith("import '@awesome.me/webawesome"))
    assert.equal(importLines.length, 2)
    assert.ok(importLines.some(l => l.includes('button/button.js')))
    assert.ok(importLines.some(l => l.includes('icon/icon.js')))
  })

  it('repeated tag → deduplicated to one import', () => {
    const result = transform('<wa-button /><wa-button /><wa-button />', '/app/src/Comp.tsx')
    assert.ok(result)
    const buttonImports = result.code.split('\n').filter(l => l.includes('button/button.js'))
    assert.equal(buttonImports.length, 1)
  })

  it('no wa-* tags → transform returns null', () => {
    const result = transform('<div>hello</div>', '/app/src/Comp.tsx')
    assert.equal(result, null)
  })

  it('disallowed extension (.css) → null', () => {
    const result = transform('<wa-button />', '/app/src/styles.css')
    assert.equal(result, null)
  })

  it('id contains node_modules → null', () => {
    const result = transform('<wa-button />', '/app/node_modules/lib/Comp.tsx')
    assert.equal(result, null)
  })

  it('tag in line comment → not imported', () => {
    const result = transform('// <wa-button>', '/app/src/Comp.tsx')
    assert.equal(result, null)
  })

  it('tag in JSX comment → not imported', () => {
    const result = transform('{/* <wa-icon /> */}', '/app/src/Comp.tsx')
    assert.equal(result, null)
  })

  it('tag in block comment → not imported', () => {
    const result = transform('/* <wa-badge> */', '/app/src/Comp.tsx')
    assert.equal(result, null)
  })

  it('transformed file includes a non-null map', () => {
    const result = transform('<wa-button />', '/app/src/Comp.tsx')
    assert.ok(result)
    assert.notEqual(result.map, null)
  })

  it('.vue file → no moduleType, import inside script block', () => {
    const result = transform('<wa-button />', '/app/src/Comp.vue')
    assert.ok(result)
    assert.equal(result.moduleType, undefined)
    const importLine = "import '@awesome.me/webawesome/dist/components/button/button.js'"
    const scriptStart = result.code.indexOf('<script>')
    const importPos = result.code.indexOf(importLine)
    const scriptEnd = result.code.indexOf('</script>')
    assert.ok(scriptStart !== -1)
    assert.ok(importPos > scriptStart && importPos < scriptEnd)
  })

  it('.svelte file → no moduleType, import inside script block', () => {
    const result = transform('<wa-button />', '/app/src/Comp.svelte')
    assert.ok(result)
    assert.equal(result.moduleType, undefined)
    const importLine = "import '@awesome.me/webawesome/dist/components/button/button.js'"
    const scriptStart = result.code.indexOf('<script>')
    const importPos = result.code.indexOf(importLine)
    const scriptEnd = result.code.indexOf('</script>')
    assert.ok(scriptStart !== -1)
    assert.ok(importPos > scriptStart && importPos < scriptEnd)
  })

  it('Vue SFC <script setup> → imports injected inside the block', () => {
    const src = '<script setup>\nconst msg = "hello"\n</script>\n<template>\n<wa-button />\n</template>'
    const result = transform(src, '/app/src/Comp.vue')
    assert.ok(result)
    assert.equal(result.moduleType, undefined)
    const importLine = "import '@awesome.me/webawesome/dist/components/button/button.js'"
    const scriptSetupEnd = result.code.indexOf('<script setup>') + '<script setup>'.length
    const importPos = result.code.indexOf(importLine)
    const scriptClose = result.code.indexOf('</script>')
    assert.ok(importPos > scriptSetupEnd && importPos < scriptClose)
  })

  it('Vue SFC with no script block → minimal script block prepended', () => {
    const src = '<template>\n<wa-button />\n</template>'
    const result = transform(src, '/app/src/Comp.vue')
    assert.ok(result)
    assert.equal(result.moduleType, undefined)
    assert.ok(result.code.startsWith('<script>'))
    const importLine = "import '@awesome.me/webawesome/dist/components/button/button.js'"
    const scriptStart = result.code.indexOf('<script>')
    const importPos = result.code.indexOf(importLine)
    const scriptEnd = result.code.indexOf('</script>')
    assert.ok(importPos > scriptStart && importPos < scriptEnd)
    assert.ok(result.code.includes('<template>'))
  })

  it('Svelte SFC with script block → imports injected inside the block', () => {
    const src = '<script>\nlet count = 0\n</script>\n<wa-button />'
    const result = transform(src, '/app/src/Comp.svelte')
    assert.ok(result)
    assert.equal(result.moduleType, undefined)
    const importLine = "import '@awesome.me/webawesome/dist/components/button/button.js'"
    const scriptStart = result.code.indexOf('<script>')
    const importPos = result.code.indexOf(importLine)
    const scriptEnd = result.code.indexOf('</script>')
    assert.ok(importPos > scriptStart && importPos < scriptEnd)
  })

  it('tag in HTML comment → not imported', () => {
    const result = transform('<!-- <wa-button> -->', '/app/src/Comp.vue')
    assert.equal(result, null)
  })
})
