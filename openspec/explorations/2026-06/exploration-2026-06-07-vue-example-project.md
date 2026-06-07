# Exploration: Vue Example Project

**Date:** 2026-06-07
**Linked change:** none

## Context

We want to add a `packages/example-vue` workspace package — a minimal Vite + Vue SFC app — that mirrors `packages/example-react` and serves as a real-world smoke test for the SFC script injection behaviour specified in `openspec/specs/sfc-script-injection/spec.md`. Once created, it can be exercised via Playwright to confirm `wa-*` components load correctly in a Vue SFC context.

## Observations

### Existing React example anatomy

```
packages/example-react/
  index.html               ← Vite entry point, <script type="module" src="/src/main.tsx">
  vite.config.ts           ← plugins: [react(), webawesome({ styles: true })]
  package.json             ← deps: react, react-dom, @awesome.me/webawesome, vite-plugin-webawesome:"*"
  tsconfig.json / tsconfig.app.json / tsconfig.node.json
  src/
    main.tsx               ← ReactDOM.createRoot(…).render(<App/>)
    App.tsx                ← uses <wa-button>, <wa-badge>, <wa-icon> — NO manual imports
    App.css / index.css
```

### Plugin SFC injection logic (index.ts)

```
transform(src, id):
  isVueSvelte = ext is .vue or .svelte
  if isVueSvelte:
    find first <script …> tag → insert imports after opening tag
    if no <script> block → prepend <script>\n<imports>\n</script>\n
  else:
    prepend imports at file root
```

The spec requires:
1. Imports injected **inside** the `<script setup>` (or `<script>`) block, not at file root.
2. No `moduleType: 'js'` returned — so Vite hands the transformed file to `@vitejs/plugin-vue` for further processing.

### What the Vue example needs to exercise

To cover all spec scenarios in a single app:

| Scenario | Component to use |
|---|---|
| `<script setup>` block | `App.vue` — main component |
| No script block (template-only SFC) | `IconRow.vue` — uses `<wa-icon>` |
| Plain `<script>` block (options API) | `BadgeRow.vue` — uses `<wa-badge>` |

A component with **both** `<script>` and `<script setup>` is an edge case; a small `BothScripts.vue` can cover it.

### npm workspace wiring

Root `package.json` uses `"workspaces": ["packages/*"]` so a new `packages/example-vue` directory is picked up automatically. The `vite-plugin-webawesome: "*"` dep resolves to the local plugin just like in the React example.

### Vue-specific deps vs React

```
React:                          Vue equivalent:
@vitejs/plugin-react            @vitejs/plugin-vue
react + react-dom               vue
@types/react + @types/react-dom (not needed — Vue has built-in types)
```

TypeScript, ESLint, and Vite versions can match the React example or whatever comes with the Vite CLI scaffolding.

### Playwright test approach

Once the dev server is running (`npm -w example-vue run dev`, default port 5173 or 5174 if React is already running), Playwright can:
1. Navigate to the app
2. Assert `<wa-button>`, `<wa-badge>`, `<wa-icon>` elements are present in the DOM
3. Assert they are upgraded (i.e. have shadow roots or a known custom-element property)

The plugin registers components via side-effect imports; if injection fails the custom elements stay as HTMLElement with no shadow DOM.

### Port conflict risk

Both example apps default to port 5173. The Vue dev server should either use a fixed different port in `vite.config.ts`, or rely on Vite's automatic `--port` fallback. Safest: hardcode `server: { port: 5174 }` in the Vue config.

## Rounds

## Round 1 — Scope & structure

### Q1.1 — Which SFC scenarios to cover in the Vue example?

The React example uses one file (`App.tsx`). For Vue we could stay simple (one `App.vue` with `<script setup>`) or add extra components to cover all spec scenarios.

- [x] One `App.vue` with `<script setup>` + one template-only child for the no-script scenario ← recommended: covers the two most important spec paths without over-engineering the example
- [ ] Only `App.vue` with `<script setup>` — minimal, but skips the no-script-block scenario
- [ ] Three separate components (script setup, options API, template-only) — thorough but noisy for a demo app

> **Your answer / freetext:**
>

### Q1.2 — TypeScript or plain JS for the Vue example?

The React example uses TypeScript throughout.

- [x] TypeScript — consistent with the React example and the plugin source ← recommended: same tooling, catches type errors in the example
- [ ] Plain JavaScript — simpler, no tsconfig needed

> **Your answer / freetext:**
>

### Q1.3 — Dev server port

Both Vite examples default to 5173. If both are running simultaneously, there will be a conflict.

- [x] Hardcode `server: { port: 5174 }` in the Vue vite.config.ts ← recommended: deterministic, avoids surprises when running Playwright
- [ ] Let Vite auto-pick a free port — works but the Playwright test needs to discover the port dynamically

> **Your answer / freetext:**
>

## Insights & Decisions

_Decision:_ Scaffold `packages/example-vue` using the Vite CLI (`npm create vite@latest`) with the `vue-ts` template — _Reason:_ Vite CLI produces a correctly wired TypeScript + Vue project (tsconfig, env.d.ts, vite.config.ts) without manual assembly; mirrors how the React example was likely set up.

_Decision:_ `App.vue` uses `<script setup lang="ts">` and includes `<wa-button>` + `<wa-badge>` — _Reason:_ exercises the primary SFC injection path (script setup block) with multiple components.

_Decision:_ Add a template-only `IconRow.vue` that uses `<wa-icon>` and has no `<script>` block — _Reason:_ exercises the no-script-block spec scenario where the plugin must prepend a full `<script>…</script>` wrapper.

_Decision:_ TypeScript throughout — _Reason:_ consistent with the React example and the plugin's own source.

_Decision:_ Hardcode `server: { port: 5174 }` in `vite.config.ts` — _Reason:_ deterministic port so Playwright tests don't need dynamic port discovery, and avoids collision when the React dev server is already on 5173.

_Decision:_ After scaffolding, add `@awesome.me/webawesome` and `vite-plugin-webawesome: "*"` to `package.json`, and wire the plugin in `vite.config.ts` with `{ styles: true }` — _Reason:_ matches the React example setup exactly.
