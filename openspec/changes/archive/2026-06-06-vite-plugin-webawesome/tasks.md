## 1. Monorepo Scaffold

- [x] 1.1 Add `package.json` at repo root with `"workspaces": ["packages/*"]` and no version/main (root is not published)
- [x] 1.2 Create `packages/plugin/` with `package.json` (name: `vite-plugin-webawesome`, type: module, exports, peerDeps: `vite`, `@awesome.me/webawesome`)
- [x] 1.3 Create `packages/example-react/` with `package.json` referencing `"vite-plugin-webawesome": "*"` as a local dep
- [x] 1.4 Run `npm install` from repo root to link workspaces

## 2. Plugin Package — TypeScript & Build Setup

- [x] 2.1 Add `tsconfig.json` to `packages/plugin` (target: ESNext, module: NodeNext, strict: true)
- [x] 2.2 Add `tsup.config.ts` to `packages/plugin` (entry: `src/index.ts`, format: `esm`, dts: true, no CJS)
- [x] 2.3 Add `build` and `dev` scripts to `packages/plugin/package.json`
- [x] 2.4 Install dev deps in `packages/plugin`: `typescript`, `tsup`, `vite` (as devDep)
- [x] 2.5 Install runtime dep `magic-string` in `packages/plugin`

## 3. Plugin Core — Auto-Import Transform

- [x] 3.1 Create `packages/plugin/src/index.ts` exporting the `webawesome(options?)` plugin factory with `enforce: 'pre'`
- [x] 3.2 Implement the file extension allowlist check (`.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`); skip `node_modules`
- [x] 3.3 Implement early-exit: return `null` if source string contains no `wa-` substring
- [x] 3.4 Implement comment-stripping: remove `//...`, `/* ... */`, and `{/* ... */}` from a copy of the source
- [x] 3.5 Implement tag extraction: apply `/<(wa-[a-z0-9-]+)/g` to the stripped string, collect unique names via `Set`
- [x] 3.6 Implement tag-to-path mapping: `wa-<name>` → `@awesome.me/webawesome/dist/components/<name>/<name>.js`
- [x] 3.7 Use `magic-string` to prepend the import block and return `{ code, map: s.generateMap({ hires: true }) }` — add `moduleType: 'js'` to the return value when the source file is `.vue` or `.svelte`

## 4. Plugin Core — Styles Injection

- [x] 4.1 Add `styles?: boolean` to the plugin options type
- [x] 4.2 Implement `configResolved` hook: resolve entry file path from `config.build.rolldownOptions.input` (Vite 8 key), fall back to `path.resolve(config.root, 'index.html')` → read the script src to get the actual entry `.ts`/`.js` file
- [x] 4.3 In `transform`, if `styles: true` and `id` matches the resolved entry path, prepend `import '@awesome.me/webawesome/dist/styles/webawesome.css'` (also via `magic-string`)

## 5. Plugin Package — Build & Types Verification

- [x] 5.1 Run `npm run build` in `packages/plugin` and verify `dist/index.js` (ESM) and `dist/index.d.ts` are emitted
- [x] 5.2 Confirm `dist/index.d.ts` exports the `webawesome` function with correct option types

## 6. Example React App

- [x] 6.1 Scaffold a Vite + React 19 + TypeScript app in `packages/example-react` (via `npm create vite`)
- [x] 6.2 Install `@awesome.me/webawesome` in `packages/example-react`
- [x] 6.3 Wire up `vite-plugin-webawesome` in `packages/example-react/vite.config.ts` with `styles: true`
- [x] 6.4 Add several `wa-*` components to `App.tsx` (e.g., `<wa-button>`, `<wa-icon>`, `<wa-badge>`) without any manual imports
- [x] 6.5 Start the dev server and verify components render correctly with no console errors

## 7. Integration Verification

- [x] 7.1 Confirm no `wa-*` imports exist anywhere in `packages/example-react/src/` (all injected by plugin)
- [x] 7.2 Confirm the global WebAwesome CSS is present in the bundle (check network tab / built CSS file)
- [x] 7.3 Verify source maps are intact: set a breakpoint in `App.tsx` in DevTools and confirm line numbers match source
- [x] 7.4 Test comment-stripping: add a commented-out `{/* <wa-dialog> */}` — confirm `dialog.js` is NOT imported
- [x] 7.5 Run `npm run build` in `packages/example-react` and confirm the production bundle contains only the used component modules
