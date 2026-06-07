## 1. Scaffold the Vue project

- [x] 1.1 Run `npm create vite@latest example-vue -- --template vue-ts` inside `packages/` to scaffold the project
- [x] 1.2 Remove boilerplate files not needed for the demo (`src/components/HelloWorld.vue`, default assets, `App.vue` content)

## 2. Wire the plugin

- [x] 2.1 Add `@awesome.me/webawesome` and `vite-plugin-webawesome: "*"` to `dependencies` in `packages/example-vue/package.json`
- [x] 2.2 Import and register `webawesome({ styles: true })` in `vite.config.ts` alongside `@vitejs/plugin-vue`
- [x] 2.3 Add `server: { port: 5174 }` to `vite.config.ts`
- [x] 2.4 Run `npm install` from the repo root to link the local plugin workspace dep

## 3. Write the Vue components

- [x] 3.1 Write `src/components/IconRow.vue` as a template-only SFC (no `<script>` block) using `<wa-icon name="heart">`, `<wa-icon name="star">`, `<wa-icon name="check-circle">`
- [x] 3.2 Write `src/App.vue` with `<script setup lang="ts">`, importing `IconRow.vue`, and using `<wa-button>` and `<wa-badge>` with no manual wa-* imports
- [x] 3.3 Update `src/main.ts` to mount `App` if the scaffold didn't already do so correctly

## 4. Verify with Playwright

- [x] 4.1 Start the Vue dev server (`npm -w example-vue run dev`) and confirm it starts on port 5174
- [x] 4.2 Use the Playwright MCP to navigate to `http://localhost:5174` and assert `<wa-button>`, `<wa-badge>`, and `<wa-icon>` elements are present in the DOM
- [x] 4.3 Assert the elements are upgraded (have shadow roots) confirming the plugin injection worked end-to-end
