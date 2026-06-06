## Context

`vite-plugin-webawesome` is a new green-field Vite plugin for the WebAwesome design system (`@awesome.me/webawesome`). WebAwesome ships web components (`wa-*` custom elements) that must be imported individually as side-effects to register with the browser. Without tooling, developers must manually track which components they use and keep import lists in sync. The plugin replaces this with zero-config auto-import by scanning source files during Vite's transform phase. The repo is an npm workspaces monorepo: `packages/plugin` (the publishable artifact) and `packages/example-react` (a React 19+ dev/test app).

## Goals / Non-Goals

**Goals:**
- Auto-inject `@awesome.me/webawesome/dist/components/[name]/[name].js` imports for every `wa-*` tag found in source files
- Support `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte` file types
- Preserve source maps correctly using `magic-string`
- Provide opt-in global CSS injection (`styles: true`) into the Vite entry file
- Ship TypeScript types; ESM-only bundle via `tsup`

**Non-Goals:**
- Non-Vite bundlers (Webpack, Rollup standalone, esbuild direct)
- React wrapper path (`dist/react/`) — deprecated, React 19+ uses native custom elements
- Framework-specific DX beyond basic tag detection (no Vue SFC `<template>` AST, no Svelte AST)
- Custom element prefix support (only `wa-*` is in scope for v1)
- SSR / Node.js rendering

## Decisions

### D1 — Vite `transform` hook for injection

The plugin uses Vite's `transform(src, id)` hook to scan each source file and prepend side-effect imports. This is the standard Vite pattern: it runs during both dev server and production build, is file-scoped (no global state needed), and allows Vite to manage the resulting dependency graph naturally.

_Alternative considered_: A `resolveId` + `load` virtual module approach would require tracking which modules need which imports centrally. Rejected: more complexity, harder to reason about, no benefit over per-file transform.

### D2 — Regex with comment-stripping for tag detection

Tag detection uses a two-pass approach:
1. Strip comments from the source string: single-line (`//...`), multi-line (`/* ... */`), and JSX block comments (`{/* ... */}`)
2. Apply `/<(wa-[a-z0-9-]+)/g` to the stripped string

This eliminates false positives from commented-out tags while keeping zero parser dependencies. The regex operates on the raw source string, not on an AST, so it works uniformly across all supported file types.

_Alternative considered_: Per-file AST parsing (Babel for JSX, vue-template-compiler for `.vue`, etc.). Rejected: heavy dependencies, per-extension branching, significant implementation complexity for marginal correctness gain.

### D3 — `magic-string` for source map generation

When imports are prepended to a file, line numbers shift. `magic-string` is used to perform the prepend and generate a proper source map offset. It is already a transitive dependency of Vite and Rollup, so it adds zero installation weight to the plugin consumer.

_Alternative considered_: Return `map: null`. Rejected: breaks debugger source maps in dev, poor DX for a developer-experience-focused plugin.

### D4 — CSS injection into Vite entry file only

When `styles: true`, the plugin injects `import '@awesome.me/webawesome/dist/styles/webawesome.css'` exactly once by:
1. Capturing the resolved entry file path in `configResolved` (from `config.build.rolldownOptions.input` — the Vite 8 / Rolldown key, renamed from `rollupOptions.input`, falling back to the `index.html`-resolved entry)
2. Only prepending the CSS import when `id === entryFilePath` in the `transform` hook

This guarantees single injection with no virtual module complexity.

_Alternative considered_: Inject into every transformed file and rely on bundler deduplication. Rejected: produces noisy module graphs and is harder to reason about.

### D5 — `enforce: 'pre'` to scan files before framework transforms

The plugin sets `enforce: 'pre'` so it runs before Vite's core plugins and framework-specific transforms (e.g., `@vitejs/plugin-vue`, `@sveltejs/vite-plugin-svelte`). This is required to scan `.vue` template markup and `.svelte` component markup in their raw source form — after those plugins run, the content is compiled to JS render functions where `wa-*` tag strings are gone.

For `.vue` and `.svelte` files, the plugin prepends side-effect imports at the very top of the raw source file and returns `{ code, map, moduleType: 'js' }` — the `moduleType: 'js'` field is required by Vite 8 / Rolldown when a plugin transforms content to JS from a non-JS source type. Without it, Rolldown cannot infer the output module type.

For `.jsx`, `.tsx`, `.js`, `.ts` files the `moduleType` field is omitted (Rolldown infers `js` from the extension).

_Note_: Prepending bare `import` statements before `<script>` in a `.vue` SFC produces invalid SFC syntax. For v1, `.vue` and `.svelte` support is best-effort; the injected imports will be placed inside the compiled JS after the framework plugin processes the file. A dedicated v2 capability should handle Vue/Svelte SFC injection properly.

### D6 — npm workspaces monorepo, tsup ESM-only

The repo uses npm workspaces. `packages/plugin` is the publishable package; `packages/example-react` consumes it via `"vite-plugin-webawesome": "workspace:*"`. The plugin is compiled with `tsup` to `dist/index.js` (ESM) + `dist/index.d.ts`. No CJS output — the Vite ecosystem is ESM-first.

## Risks / Trade-offs

**Comment-stripping false negatives** → The regex strips `//`, `/* */`, and JSX `{/* */}` comments. Template literals containing `wa-` tags will still match — acceptable since this is unlikely in practice and produces a harmless extra import.

**Entry file detection in non-standard setups** → Projects that use a `lib` mode entry, multi-page apps, or unusual `rolldownOptions.input` shapes may not resolve the entry path correctly, causing CSS to not be injected. Mitigation: document the limitation; `styles: true` is opt-in and uncommon for advanced setups.

**`transform` re-runs on every HMR update** → The regex + comment-stripping runs on every file change. For large files this could add latency. Mitigation: early-exit if no `wa-` string appears anywhere in the file before running the full strip-and-match pipeline.

**Side-effect import deduplication within a file** → The same tag can appear many times. A `Set<string>` deduplicates found component names before building the import block, so at most one import per component per file.

## Migration Plan

Green-field — no migration needed. The example app in `packages/example-react` serves as the integration test harness. Publishing to npm is manual (`npm publish` from `packages/plugin`) and out of scope for this change.

## Open Questions

_(none — all decisions resolved during exploration)_
