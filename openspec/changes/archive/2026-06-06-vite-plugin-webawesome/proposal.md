## Why

WebAwesome (`wa-*`) web components are powerful but require manual per-component imports in every Vite project, creating friction, FOUC risk, and TypeScript boilerplate. A Vite plugin can eliminate all of this by auto-detecting usage at build-time and injecting registrations automatically — so developers write `<wa-button>` and the plugin handles the rest.

## What Changes

- **New repo structure**: npm workspaces monorepo with two packages — a publishable plugin (`packages/plugin`) and a React 19+ example app (`packages/example-react`)
- **New Vite plugin**: `vite-plugin-webawesome` — a TypeScript plugin that hooks into Vite's `transform` pipeline to scan source files for `wa-*` tags and inject side-effect component imports
- **Opt-in styles injection**: Plugin option `styles: true` injects the WebAwesome global CSS into the app entry point once, handling FOUC prevention automatically
- **ESM-only package**: Built with `tsup`, ships `dist/index.js` + `dist/index.d.ts`, no CJS

## Capabilities

### New Capabilities

- `auto-import`: Scans `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte` files for `wa-*` custom element tags (with comment-stripping), maps each tag to its component path at `@awesome.me/webawesome/dist/components/[name]/[name].js`, deduplicates, and prepends side-effect imports using `magic-string` to preserve source maps
- `styles-injection`: When `styles: true` is set, injects `import '@awesome.me/webawesome/dist/styles/webawesome.css'` into the Vite entry file exactly once, detected via `configResolved`

### Modified Capabilities

## Impact

- **New packages**: `packages/plugin` (published as `vite-plugin-webawesome`), `packages/example-react` (local dev only)
- **New dependencies (plugin)**: `magic-string` (runtime), `vite` (peer), `@awesome.me/webawesome` (peer)
- **New dev dependencies (plugin)**: `typescript`, `tsup`
- **No existing code changed**: green-field repository
