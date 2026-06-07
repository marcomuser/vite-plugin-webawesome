## Why

The SFC script injection feature (`sfc-script-injection`) has unit tests but no real-world smoke test — a live Vue app exercising it end-to-end. Adding `packages/example-vue` gives us a runnable app that proves the plugin's Vue SFC transform works correctly in a full Vite + `@vitejs/plugin-vue` pipeline, and can be driven by Playwright to catch regressions.

## What Changes

- Add `packages/example-vue` — a new npm workspace package scaffolded via the Vite CLI (`vue-ts` template)
- Wire `vite-plugin-webawesome` with `{ styles: true }` into its `vite.config.ts`
- `App.vue` uses `<script setup lang="ts">` with `<wa-button>` and `<wa-badge>` (no manual imports)
- `IconRow.vue` is a template-only SFC (no `<script>` block) using `<wa-icon>`, exercising the plugin's "prepend full `<script>` block" path
- Dev server port hardcoded to `5174` to avoid collision with the React example on `5173`

## Capabilities

### New Capabilities

- `vue-example`: A minimal runnable Vue SFC app that demonstrates and smoke-tests the plugin's SFC import injection

### Modified Capabilities

_(none — no existing spec requirements are changing)_

## Impact

- New directory `packages/example-vue/` added to the workspace
- No changes to `packages/plugin/` source or any existing package
- New runtime deps: `vue`, `@vitejs/plugin-vue`, `@awesome.me/webawesome`, `vite-plugin-webawesome: "*"` (resolved locally)
