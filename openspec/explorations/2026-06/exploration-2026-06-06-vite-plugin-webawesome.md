# Exploration: vite-plugin-webawesome

**Date:** 2026-06-06
**Linked change:** none

## Context

We want to build a Vite plugin that makes WebAwesome (`wa-*`) web components behave like native HTML elements — zero manual imports, no FOUC, no TypeScript ceremony. The plugin scans source files at build-time, detects `wa-*` tag usage, and injects the appropriate side-effect imports automatically. The repo is empty; we're designing from scratch and want a publishable plugin package alongside a working React example app.

## Observations

### WebAwesome Package Structure

- All components follow a predictable path: `@awesome.me/webawesome/dist/components/[name]/[name].js`
  - `wa-button` → `.../components/button/button.js`
  - `wa-icon` → `.../components/icon/icon.js`
- These are **side-effect imports** (no default export) — importing registers the custom element globally
- No barrel export exists; cherry-picking is the intended usage model
- Global styles: `@awesome.me/webawesome/dist/styles/webawesome.css`
- React wrappers exist at `.../dist/react/[name]/index.js` — a separate code path for React users. However, we do not want to use them as we target frameworks which support custom elements by default only. This includes React 19+.

### Vite Plugin API Surface

The relevant hooks for this plugin:

```
transform(src, id)  ← scan source code, inject imports
resolveId(id)       ← virtual module resolution
load(id)            ← virtual module content
handleHotUpdate()   ← HMR: re-scan when file changes
```

The `transform` hook receives raw source text + the file path. It can return `{ code, map }` — the simplest injection is prepending import statements to the string. Vite then handles the rest of the dependency graph.

```
File processed by Vite
       │
       ▼
  transform(src, id)
       │
  [scan for wa-* tags]
       │
  [map tag → import path]
       │
  [prepend imports to src]
       │
       ▼
  Return { code: `import '...'; \n${src}`, map: null }
       │
       ▼
  Vite resolves + bundles normally
```

### Tag Detection Approaches

**Regex approach** — simple, fast, works across all file types:
```
/<(wa-[a-z0-9-]+)/g
```
Matches `<wa-button`, `<wa-icon`, etc. Works in JSX, Vue templates, Svelte, plain HTML.
Risk: false positives in strings/comments (low in practice).

**AST approach** — precise but expensive. Requires a parser per file type (Babel for JSX, vue-template-compiler for Vue SFCs, etc.). Handles edge cases like commented-out tags. Significant complexity.

### Deduplication

The same component can appear multiple times in a file. We need `Set<string>` dedup before injecting — only one import per component per file. Across files, Vite's module graph handles deduplication naturally (side-effect imports are tracked once).

### Similar Plugin Art

- **unplugin-vue-components** — uses `unplugin` abstraction, resolves components via transform hook, supports Vue SFCs deeply. Good reference for architecture.
- **Shoelace** has a similar package structure (`sl-` prefix) — some community plugins exist that use the same regex + inject pattern.
- **unplugin** — allows writing one plugin that works for Vite, Webpack, Rollup, esbuild simultaneously. Tradeoff: abstraction overhead, less direct Vite API access.

### Repo Structure Candidates

**Option A — Monorepo (pnpm workspaces)**
```
vite-plugin-webawesome/
  packages/
    plugin/          ← the publishable npm package
      src/index.ts
      package.json   ← name: "vite-plugin-webawesome"
    example-react/   ← vite react app consuming the plugin
      src/App.tsx
      vite.config.ts
  pnpm-workspace.yaml
  package.json
```

**Option B — Flat repo with example as subfolder**
```
vite-plugin-webawesome/
  src/              ← plugin source
  example/          ← react app, references plugin via relative path
  package.json
```

Option A is cleaner for eventual publishing; Option B is simpler to bootstrap.

### FOUC Prevention

Custom elements render as unknown `HTMLElement` until their definition loads. The browser shows un-styled content briefly. Two strategies:

1. **Import-before-render** — the plugin's injected imports run synchronously before the component's render cycle, so no FOUC in practice with bundled code.
2. **`:not(:defined)` CSS rule** — `wa-button:not(:defined) { visibility: hidden }` hides undefined elements. WebAwesome ships this in its global stylesheet, so importing `webawesome.css` handles it.

The plugin can optionally auto-inject the CSS import once per app entry point.

---

## Rounds

## Round 1 — Plugin Architecture

### Q1.1 — Bundler scope: Vite-only or unplugin?

Should we use the `unplugin` abstraction to support Webpack/Rollup/esbuild too, or target Vite exclusively for a simpler, more direct implementation?

- [x] Vite-only ← recommended: the project name is vite-plugin-webawesome, the user story is Vite-specific, and unplugin adds abstraction overhead without clear demand. Can always migrate later.
- [ ] unplugin (Vite + Webpack + Rollup + esbuild) — future-proof, more users, but significantly more complex to develop and test

> **Your answer / freetext:**
>

### Q1.2 — Tag detection: regex or AST?

How should the plugin scan files for `wa-*` tags?

- [ ] Regex (`/<(wa-[a-z0-9-]+)/g`) ← recommended: fast, zero dependencies, works across JSX/TSX/Vue/Svelte/HTML, false-positive rate is negligible in real codebases
- [ ] Per-file AST (Babel for JSX, vue-template-compiler for .vue, etc.) — precise but pulls in heavy parser dependencies and requires per-extension branching
- [x] Regex with comment-stripping — strip `//`, `/* */`, JSX `{/* */}` before scanning; eliminates false positives from commented-out tags

> **Your answer / freetext:**
>

### Q1.3 — CSS/styles injection: automatic or opt-in?

Should the plugin automatically inject `import '@awesome.me/webawesome/dist/styles/webawesome.css'` once into the app entry, or leave CSS to the user?

- [x] Opt-in via plugin option (default: false) ← recommended: avoids surprising users who manage CSS differently; easy to enable with `webawesome({ styles: true })`
- [ ] Automatic (always inject) — simplest user experience, but may conflict with custom theming setups
- [ ] Not supported — user always manages CSS manually

> **Your answer / freetext:**
>

### Q1.4 — React JSX: use native element path or React wrapper path?

WebAwesome ships both raw web components (`.../components/button/button.js`) and React wrappers (`.../react/button/index.js`). Which should the plugin import in React projects?

- [x] Always use native component path (`.../components/`) ← recommended: works universally, no framework detection needed, React handles custom elements fine since React 19. The wrappers are deprecated and should be ignored.
- [ ] Auto-detect React and use React wrapper path (`.../react/`) — better DX in React (typed props, ref forwarding) but requires detecting the framework and different tag mapping
- [ ] Configurable via option (`webawesome({ react: true })`) — explicit, flexible, but adds config surface

> **Your answer / freetext:**
>

## Round 2 — Project & Package Structure

### Q2.1 — Repo layout: monorepo or flat?

The repo needs a publishable plugin package and a React example app. How should they be organized?

- [ ] Monorepo with pnpm workspaces ← recommended: clean separation, the plugin package can be linked locally via `workspace:*`, reflects the eventual published structure exactly
- [ ] Flat repo (plugin source at root, example as subfolder) — simpler bootstrap, but `package.json` mixes plugin metadata with dev tooling and makes publishing trickier
- [ ] Two separate repos — maximum isolation, but adds friction when iterating between plugin and example

> **Your answer / freetext:**
> Monorepo with npm workspaces.

### Q2.2 — TypeScript for the plugin source?

Should the plugin package be authored in TypeScript with a build step, or plain JavaScript?

- [x] TypeScript ← recommended: the plugin will be consumed in `.ts`/`.tsx` projects, so shipping types is expected; `tsup` or `unbuild` makes the build step trivial
- [ ] Plain JavaScript with JSDoc types — zero build step, but authored types are second-class and harder to keep accurate
- [ ] Plain JavaScript, no types — simplest possible, but poor DX for consumers

> **Your answer / freetext:**
>

### Q2.3 — Which file extensions should the plugin transform?

The `transform` hook fires for every file Vite processes. We need an allowlist to avoid scanning node_modules, CSS files, etc.

- [x] `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte` ← recommended: covers all mainstream frameworks; the regex is fast enough that broad coverage is fine
- [ ] Only `.jsx` and `.tsx` — React-only scope, keeps it focused given the example app is React
- [ ] Configurable via `include`/`exclude` glob options — maximum flexibility, but adds API surface; start narrow and expand on demand

> **Your answer / freetext:**
>

### Q2.4 — Build tool for the plugin package itself?

What tool compiles `src/index.ts` → `dist/index.js` + `dist/index.d.ts` for publishing?

- [x] `tsup` ← recommended: zero-config, outputs ESM + CJS + `.d.ts` from one command, widely used in the Vite ecosystem (Vite itself uses it for plugins). But ignore CJS. We dont care about CJS.
- [ ] `unbuild` — similar story, slightly more config, used by unjs/unplugin ecosystem
- [ ] `tsc` only — produces `.d.ts` but not bundled JS; requires separate rollup step for CJS/ESM

> **Your answer / freetext:**
>

## Round 3 — Implementation Edge Cases

### Q3.1 — CSS injection: how to inject exactly once per app?

When `styles: true`, the CSS import must appear exactly once in the bundle (not once per transformed file). How?

- [x] Inject into the Vite entry file only ← recommended: `configResolved` gives us `config.build.rollupOptions.input` (or `index.html` default); we only prepend the CSS import when `id` matches the entry. Clean, predictable, no virtual module needed.
- [ ] Virtual module (`virtual:webawesome-styles`) that re-exports the CSS — import it from every transformed file and let Vite deduplicate. More complex, but decouples injection from entry detection.
- [ ] Let the user handle it — document that they need `import '@awesome.me/webawesome/dist/styles/webawesome.css'` in their `main.tsx`. Styles option becomes a no-op / not implemented.

> **Your answer / freetext:**
>

### Q3.2 — Source maps: magic-string or skip?

Prepending imports shifts line numbers, breaking debugger source maps. How do we handle this?

- [x] Use `magic-string` to prepend and generate a proper source map ← recommended: it's a tiny dependency, already a transitive dep of Vite/Rollup, and it's the standard approach for Vite plugins that inject code
- [ ] Return `map: null` — skip source maps. Line offsets are small (N import lines prepended), so the practical debugging impact is minimal for a component registration plugin
- [ ] Return the original map unchanged — incorrect but harmless for this use case since injected lines are invisible in userland

> **Your answer / freetext:**
>

### Q3.3 — HMR: explicit handling or rely on Vite default?

When a file changes in dev mode, Vite re-runs `transform`. Do we need a `handleHotUpdate` hook?

- [x] No explicit HMR hook needed ← recommended: re-running `transform` on edit is sufficient — if you add a new `wa-button` to a file, the next hot update re-scans and injects. No module-graph invalidation is needed because side-effect imports are stateless.
- [ ] Implement `handleHotUpdate` to invalidate the module if new `wa-*` tags appear — more correct in theory, but `transform` re-running already covers this case.
- [ ] Warn in the console during dev if a new component tag appears that wasn't present at startup — diagnostic aid, adds complexity.

> **Your answer / freetext:**
>

## Insights & Decisions

_Decision:_ Vite-only plugin (no unplugin abstraction) — _Reason:_ Project is Vite-specific; unplugin complexity buys nothing for this use case. Can always migrate.

_Decision:_ Tag detection via regex with comment-stripping — _Reason:_ Zero dependencies, fast, works across all file types. Stripping `//`, `/* */`, and JSX `{/* */}` comments eliminates the only realistic false-positive scenario.

_Decision:_ CSS injection is opt-in (`webawesome({ styles: true })`, default `false`) — _Reason:_ Avoids conflicts with user-managed theming setups; easy to enable when wanted.

_Decision:_ Always import native component path (`dist/components/[name]/[name].js`) — _Reason:_ React wrappers are deprecated; React 19+ handles custom elements natively. One code path for all frameworks.

_Decision:_ npm workspaces monorepo with two packages: `packages/plugin` and `packages/example-react` — _Reason:_ Clean publish boundary; plugin is linkable locally via `workspace:*` during development.

_Decision:_ Plugin authored in TypeScript, built with `tsup`, ESM-only output — _Reason:_ Consumers are TypeScript projects; ESM is sufficient in 2026; tsup is zero-config for this shape.

_Decision:_ Transform allowlist: `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte` — _Reason:_ Broad coverage with negligible cost; avoids per-framework configuration.

_Decision:_ CSS (when `styles: true`) injected into the Vite entry file only, detected via `configResolved` — _Reason:_ Cleanest mechanism; single injection point, no virtual module complexity.

_Decision:_ Use `magic-string` for source map generation when prepending imports — _Reason:_ Already a transitive Vite/Rollup dependency; standard approach; keeps debugger line numbers accurate.

_Decision:_ No explicit `handleHotUpdate` hook — _Reason:_ Vite re-runs `transform` on file change, which re-scans and re-injects. Side-effect imports are stateless so no manual invalidation is needed.
