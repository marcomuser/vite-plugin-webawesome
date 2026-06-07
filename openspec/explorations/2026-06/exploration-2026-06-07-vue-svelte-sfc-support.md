# Exploration: vue-svelte-sfc-support

**Date:** 2026-06-07
**Linked change:** none

## Context

The plugin currently processes `.vue` and `.svelte` files by prepending `import` statements to the raw file content and returning `moduleType: 'js'`. Both of these behaviours break SFC support: prepending to the raw file produces invalid SFC syntax, and returning `moduleType: 'js'` tells Vite to skip the framework compiler entirely. The goal is to find a low-overhead, low-maintenance approach that correctly injects side-effect imports into the `<script>` block so that the Vue / Svelte compilers can still do their job.

## Observations

### What the current code does

```
.vue or .svelte file
  ↓ transform (enforce: 'pre')
import 'wa-button.js'       ← prepended to the top of the raw SFC
<template>
  <wa-button />
</template>
<script setup>…</script>
  ↓ moduleType: 'js'        ← Vite treats the result as plain JS, skips @vitejs/plugin-vue
```

Two compounding bugs:
1. **Prepend to raw file** — SFC parsers (`@vue/compiler-sfc`, Svelte compiler) reject bare JS `import` statements outside any block.
2. **`moduleType: 'js'`** — Forces Vite to treat the already-broken output as JS, skipping the framework compiler entirely. The component is never compiled.

### Vite transform pipeline (enforce: 'pre')

```
Raw .vue file on disk
  │
  ▼  enforce:'pre' plugins run first
  [our plugin] → modifies content
  │
  ▼  default-order plugins
  [@vitejs/plugin-vue] → compiles SFC → virtual modules
  │
  ▼  enforce:'post' plugins
  ...
```

Because we run with `enforce: 'pre'` and Vue / Svelte compilers do **not** set `enforce: 'pre'` (they run in default order), our modified SFC content is passed to the framework compiler. If the content is valid SFC, it is compiled correctly.

**Key insight:** we must NOT return `moduleType: 'js'` for SFC files. That flag tells Vite the result is already JS — the framework compiler is never called.

### What popular plugins do

| Plugin | Approach |
|--------|----------|
| `unplugin-vue-components` | Uses `@vue/compiler-sfc` to parse the full SFC, extracts template component usage, rewrites `<script setup>` with `@babel/types` or MagicString. Heavy — full AST. |
| `vite-plugin-components` (older) | Same approach. |
| `unplugin-auto-import` | Processes virtual `?vue&type=script` modules (post-split), not the raw SFC. |
| Simple third-party plugins (e.g. `vite-plugin-svg-icons`) | Regex-inject into `<script>` block — no compiler dependency. |

For our use case (side-effect imports only, no re-exports, no template manipulation) the full AST parse of `unplugin-vue-components` is unnecessary. A regex injection into the `<script>` block is sufficient and has zero additional dependencies.

### What "inject into `<script>` block" looks like

**Input (raw .vue):**
```html
<template>
  <wa-button>Click</wa-button>
</template>
<script setup lang="ts">
const label = 'hello'
</script>
```

**After our transform (still valid SFC):**
```html
<template>
  <wa-button>Click</wa-button>
</template>
<script setup lang="ts">
import '@awesome.me/webawesome/dist/components/button/button.js'
const label = 'hello'
</script>
```

**Then `@vitejs/plugin-vue` compiles it normally.**

For Svelte, identical structure — `<script>` block at top level:
```svelte
<script>
import '@awesome.me/webawesome/dist/components/button/button.js'
</script>
<wa-button>Click</wa-button>
```

### Regex to find and inject into `<script>` block

```ts
// Matches the opening <script> tag with any attributes
const scriptTagRe = /(<script\b[^>]*>)/
const match = src.match(scriptTagRe)
if (match && match.index !== undefined) {
  const insertPos = match.index + match[0].length
  s.prependLeft(insertPos, '\n' + imports.join('\n'))
} else {
  // No <script> block → prepend a minimal one
  s.prepend('<script>\n' + imports.join('\n') + '\n</script>\n')
}
```

No extra dependencies. MagicString is already a dependency. Source maps remain correct.

### Edge cases to decide on

1. **Vue: `<script>` + `<script setup>` coexist** — Vue 3 allows both. Which one do we inject into?
   - `<script setup>` is the idiomatic modern place; the regex finds the first match which could be either.
   - Side-effect imports work in either block, so the first match is safe.

2. **No `<script>` block** — Need to add one. Where (before or after `<template>`)?
   - Convention: before `<template>` for Vue; before the HTML for Svelte.

3. **`<script>` inside a comment or string** — The regex could false-match. But `<wa-button>` inside comments is already filtered by `stripComments()`. The same minimal risk applies here; in practice SFCs don't embed raw `<script>` strings in weird places.

4. **Styles injection on the entry file** — If the entry file is a `.vue` or `.svelte` file, the CSS import also needs to go into `<script>` not be prepended to the file root.

### `moduleType: 'js'` — remove or keep?

**Remove it.** The field was almost certainly added to avoid a Vite warning about unrecognised extensions returning transformed content. With Vite 8 + Rolldown, `moduleType` in the plugin `TransformResult` controls whether the output is treated as JS or passed on. Setting `'js'` for a `.vue` file actively prevents the Vue compiler from running.

Without `moduleType`, Vite's internal handling looks at the extension: `.vue` files are passed to `@vitejs/plugin-vue`, `.svelte` files to the Svelte plugin, as expected.

---

## Rounds

## Round 1 — Injection strategy

### Q1.1 — Where to inject when there is no `<script>` block

When a `.vue` or `.svelte` SFC has no `<script>` block, the plugin needs to add one. Where should the injected block go?

- [x] Prepend a `<script>` block before the rest of the file ← recommended: safe for both Vue and Svelte, no need to find `<template>` position
- [ ] Append a `<script>` block after all existing blocks
- [ ] Skip the file (return null) if no `<script>` block is found

> **Your answer / freetext:**
>

### Q1.2 — Which `<script>` block to target when Vue has both `<script>` and `<script setup>`

Vue 3 allows a file to have both `<script>` (for options-API non-setup code) and `<script setup>`. Our regex finds the first match.

- [x] Use the first `<script>` tag found (simplest, side-effects work in either) ← recommended: zero extra complexity, side-effect imports are valid anywhere
- [ ] Prefer `<script setup>` by matching specifically for it first, fall back to `<script>`
- [ ] Inject into both blocks to be safe

> **Your answer / freetext:**
>

### Q1.3 — Scope: should `.vue` / `.svelte` handling be opt-in via plugin options?

The current plugin has no framework-specific options. Should SFC injection be always-on (matching the current auto-import behaviour for JS/TS) or gated behind a `vue: true` / `svelte: true` option?

- [x] Always-on — consistent with how JS/TS auto-import works today ← recommended: less config surface, matches user expectation
- [ ] Opt-in per framework (e.g. `{ vue: true }`) — explicit, avoids surprising behaviour in non-Vue/Svelte projects

> **Your answer / freetext:**
>

## Round 2 — Tag extraction & comment stripping inside SFCs

### Q2.1 — Scan scope: whole SFC file or template block only?

The current `extractTags` scans the entire file source. For SFCs, `<wa-*>` elements only ever appear in the `<template>` (or Svelte markup) section — not in `<script>` or `<style>`. Should we narrow the scan to the template block?

- [x] Keep scanning the whole file ← recommended: zero extra complexity, `<wa-*>` in `<script>` strings is pathologically rare and causes no real harm; template-only extraction needs another regex to locate the block
- [ ] Extract only from content between `<template>` and `</template>` — marginally safer, avoids theoretical false positives from string literals in `<script>`

> **Your answer / freetext:**
>

### Q2.2 — HTML comments in Vue templates: `<!-- <wa-button> -->`

The current `stripComments()` handles JS block comments (`/* */`), JS line comments (`//`), and JSX comments (`{/* */}`). It does NOT strip HTML comments (`<!-- -->`). A `<wa-button>` inside a Vue template HTML comment would currently generate a spurious import.

- [x] Add `<!-- ... -->` stripping to `stripComments()` ← recommended: cheap one-liner, consistent with existing comment-stripping intent
- [ ] Leave it — false positives from HTML comments are harmless side-effect imports, not worth the added regex

> **Your answer / freetext:**
>

### Q2.3 — Existing tests for `moduleType: 'js'`

There are currently two tests that assert `moduleType === 'js'` for `.vue` and `.svelte` files. After the fix, `moduleType` should NOT be set. Should those tests be updated to assert the correct (fixed) behaviour?

- [x] Yes — update the tests to assert `moduleType` is `undefined` and that imports are inside the `<script>` block ← recommended: tests should reflect correct behaviour
- [ ] Delete the `moduleType` tests and add new SFC-injection tests separately

> **Your answer / freetext:**
>

## Insights & Decisions

_Decision:_ Remove `moduleType: 'js'` from the transform result for `.vue` and `.svelte` files — _Reason:_ returning `'js'` tells Vite the output is already compiled JS and skips the Vue/Svelte compiler entirely, breaking SFC support.

_Decision:_ For SFC files, inject imports after the `<script` opening tag (using MagicString `prependLeft`) rather than prepending to the file root — _Reason:_ bare JS `import` statements outside any block are invalid SFC syntax and break `@vitejs/plugin-vue` / the Svelte compiler.

_Decision:_ When no `<script>` block exists, prepend a minimal `<script>\n…\n</script>` block before the rest of the file — _Reason:_ simplest safe default, works for both Vue and Svelte without needing to locate the `<template>` position.

_Decision:_ Target the first `<script>` tag found when both `<script>` and `<script setup>` are present — _Reason:_ side-effect imports are valid in either block; the added complexity of preferring `<script setup>` is not justified.

_Decision:_ SFC injection is always-on (no new options) — _Reason:_ consistent with how JS/TS auto-import works today; minimises config surface.

_Decision:_ Keep scanning the whole SFC file for `<wa-*>` tags (no template-only extraction) — _Reason:_ `<wa-*>` in `<script>` string literals is pathologically rare; avoiding it requires an extra regex to locate the template block.

_Decision:_ Add HTML comment stripping (`<!-- ... -->`) to `stripComments()` — _Reason:_ cheap one-liner, consistent with existing JS/JSX comment-stripping intent; prevents spurious imports from commented-out template tags.

_Decision:_ Update existing `moduleType: 'js'` tests to assert `moduleType === undefined` and that imports appear inside the `<script>` block — _Reason:_ tests must reflect correct post-fix behaviour, not the broken pre-fix state.
