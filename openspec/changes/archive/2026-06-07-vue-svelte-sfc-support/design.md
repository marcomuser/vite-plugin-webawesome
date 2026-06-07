## Context

The plugin runs with `enforce: 'pre'`, so its `transform` output is received by `@vitejs/plugin-vue` and the Svelte plugin (both default-order). The current code has two compounding bugs for `.vue` and `.svelte` files:

1. It prepends bare `import` statements to the raw SFC source — invalid syntax that SFC parsers reject.
2. It returns `moduleType: 'js'` — a Vite / Rolldown signal that the output is already compiled JS, causing Vite to skip the framework compiler entirely.

`MagicString` is already a production dependency. No new deps are needed.

## Goals / Non-Goals

**Goals:**
- Fix `.vue` and `.svelte` SFC processing so framework compilers run correctly after our transform
- Inject side-effect imports inside the `<script>` block rather than at the file root
- Handle the no-`<script>` case by creating a minimal block
- Prevent spurious imports from HTML-commented tags

**Non-Goals:**
- Full AST parse of SFC files (unnecessary for side-effect-only imports)
- Framework-specific options / opt-in config surface
- Injecting into the template or style blocks
- Supporting non-standard SFC structures (e.g., multiple `<script>` blocks beyond what Vue 3 allows)

## Decisions

### D1 — Remove `moduleType: 'js'` for SFC files

Return `{ code, map }` without a `moduleType` field for `.vue` / `.svelte` transforms. Without `moduleType`, Vite routes the file by extension to the correct framework plugin.

_Alternative_: Keep `moduleType: 'js'` and rely on the framework plugin running before ours. Rejected — `enforce: 'pre'` means we always run first; there is no way to "run after" without restructuring the entire plugin.

### D2 — Inject after `<script` opening tag via MagicString `prependLeft`

Match the first `<script\b[^>]*>` in the source. On match, call `s.prependLeft(insertPos, '\n' + imports.join('\n'))` where `insertPos = match.index + match[0].length`. This inserts the imports as the first lines of the script block body, keeping the SFC structurally valid.

_Alternative_: Use `@vue/compiler-sfc` to do a full AST parse and rewrite. Rejected — adds a heavy optional dependency, is framework-specific, and is unnecessary for side-effect-only imports.

### D3 — No `<script>` block: prepend a minimal one before the rest of the file

`s.prepend('<script>\n' + imports.join('\n') + '\n</script>\n')`. Prepending is safe for both Vue (which expects `<script>` before `<template>` by convention) and Svelte.

_Alternative_: Skip (return `null`) if no `<script>` block. Rejected — components without a `<script>` block are common and valid; we must not silently drop their imports.

_Alternative_: Append after all existing blocks. Rejected — the Svelte compiler requires `<script>` before markup; appending could break Svelte files.

### D4 — Target the first `<script>` tag when both `<script>` and `<script setup>` coexist (Vue 3)

The regex `/<script\b[^>]*>/` finds the first match. Side-effect imports are valid in either `<script>` or `<script setup>`. Targeting the first is simplest and correct.

_Alternative_: Always prefer `<script setup>` via a two-pass regex. Rejected — extra complexity with no practical benefit; side-effects work in either block.

### D5 — Add HTML comment stripping to `stripComments()`

Extend `stripComments()` with a `src.replace(/<!--[\s\S]*?-->/g, '')` pass. This prevents `<wa-button>` inside Vue template comments from generating spurious imports.

_Alternative_: Leave HTML comments unstripped — the import is a side-effect and harmless. Rejected — generating unneeded imports is incorrect behaviour and confusing to users.

### D6 — SFC injection is always-on, no new options

Consistent with how JS/TS auto-import works today. Minimises config surface.

## Risks / Trade-offs

- **`<script>` false-match in edge cases** → `stripComments()` already reduces this risk. Pathological SFCs that embed raw `<script>` tags in string literals are extremely rare and not a supported use case.
- **HTML comment regex is greedy across multiple comments** → `[\s\S]*?` is non-greedy; multiple separate `<!-- -->` comments are each stripped independently. No concern.
- **Svelte 5 runes syntax** → Svelte 5 uses `<script>` blocks the same way; no structural change needed.

## Migration Plan

No migration required. The fix corrects previously broken behaviour. Users with `.vue` or `.svelte` files will see them processed correctly for the first time. No config changes, no API changes, no opt-in needed.
