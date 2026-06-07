## Context

`packages/example-react` is an existing Vite workspace package that demonstrates `vite-plugin-webawesome` in a React app. The SFC script injection feature for `.vue` files was implemented and unit-tested, but has no live app to exercise the full Vite → `@vitejs/plugin-vue` pipeline.

## Goals / Non-Goals

**Goals:**
- Create `packages/example-vue` as a minimal TypeScript + Vue SFC app in the npm workspace
- Demonstrate `<script setup>` injection (primary path) and no-script-block injection (secondary path)
- App can be started with `npm run dev` and visited in a browser or Playwright

**Non-Goals:**
- Comprehensive feature showcase (the React example already covers that)
- E2E test suite in CI (Playwright is used manually / ad-hoc to verify; no test infra to set up)
- Svelte example (separate concern)

## Decisions

**Use the Vite CLI to scaffold (`npm create vite@latest example-vue -- --template vue-ts`)**
Produces a correctly wired project (env.d.ts, tsconfig trio, vite.config.ts) without manual assembly. The scaffolded output is committed as-is and then modified to add the plugin.

**`App.vue` with `<script setup lang="ts">` using `<wa-button>` and `<wa-badge>`**
Exercises the primary SFC injection path. No manual imports of those components — the plugin injects them.

**`IconRow.vue` as a template-only SFC (no `<script>` block) using `<wa-icon>`**
Exercises the "no-script-block" spec scenario. The plugin must synthesise and prepend a full `<script>\n…\n</script>` block. This component is imported by `App.vue`.

**TypeScript throughout**
Consistent with the React example and plugin source. The Vite CLI `vue-ts` template handles all tsconfig setup.

**`server: { port: 5174 }` in vite.config.ts**
Deterministic port avoids collision with the React dev server (5173) and makes Playwright navigation reliable without port discovery logic.

**Plugin wired with `{ styles: true }`**
Matches the React example. Exercises the styles injection path on `main.ts` as well as component import injection on `.vue` files.

## Risks / Trade-offs

[npm install cost] → `vue` and `@vitejs/plugin-vue` are added to the workspace; they are devDependencies only and do not affect the published plugin. Acceptable.

[Vite CLI output diverges over time] → The scaffolded files are committed and not regenerated, so version drift is only an issue if someone re-scaffolds. Mitigated by documenting the scaffold command in the tasks.
