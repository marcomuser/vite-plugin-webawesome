# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

npm workspaces monorepo with two packages:

- `packages/plugin` — the publishable Vite plugin (`vite-plugin-webawesome`)
- `packages/example-react` — a React app that exercises the plugin locally via `"vite-plugin-webawesome": "*"`

## Commands

All commands are run from within the relevant package directory, or via `npm -w <package> run <script>` from the root.

**Plugin (`packages/plugin`)**
```bash
npm run build      # compile with tsup (ESM + .d.ts + sourcemaps → dist/)
npm run dev        # tsup in watch mode during development
```

**Example app (`packages/example-react`)**
```bash
npm run dev        # start Vite dev server
npm run build      # tsc type-check + Vite production build
npm run lint       # ESLint
npm run preview    # serve the production build locally
```

There is no test suite yet.

## Plugin architecture

The entire plugin lives in `packages/plugin/src/index.ts` and exports a single Vite plugin factory `webawesome(options?)`.

**Two features, one transform hook:**

1. **Auto-import** (`transform` hook): For every processed source file (`.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`) that isn't in `node_modules`, the plugin strips comments, scans for `<wa-*` tags via regex, and prepends a side-effect import for each unique tag. The mapping is `wa-<name>` → `@awesome.me/webawesome/dist/components/<name>/<name>.js`. Uses `MagicString` to return a proper source map alongside the transformed code.

2. **Styles injection** (`styles: true` option): In `configResolved`, the plugin resolves the application entry file — first from `config.build.rolldownOptions.input` (Vite 8 / Rolldown), falling back to parsing `index.html` for a `<script type="module">` tag. In `transform`, if the current file is the resolved entry, it also prepends `import '@awesome.me/webawesome/dist/styles/webawesome.css'`.

Early-exit: if a file contains no `wa-` substring at all, the transform returns `null` immediately without comment stripping or regex work.

## Development workflow

This project uses the **OpenSpec** spec-driven workflow (see `openspec/`). Changes are proposed, tracked, and archived under `openspec/changes/`. Active specs live in `openspec/specs/`. Use the `/enpalspec:*` skills (`/enpalspec:propose`, `/enpalspec:apply`, `/enpalspec:verify`, `/enpalspec:archive`) when implementing new features.
