# vite-plugin-webawesome

> **Proof of concept** — ideally this plugin should eventually live in the [Web Awesome](https://github.com/shoelace-style/webawesome) repository itself.

A Vite plugin for [Web Awesome](https://www.npmjs.com/package/@awesome.me/webawesome) that auto-imports component definitions on use. Drop `<wa-*>` tags into your markup and they just work like native HTML elements. The plugin scans each source file for `<wa-*>` usage and prepends the matching side-effect import (e.g. `<wa-button>` → `import '@awesome.me/webawesome/dist/components/button/button.js'`). An optional `styles: true` flag injects the Web Awesome CSS bundle at the app entry point. Supports `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, and `.svelte`.

## Usage

Since this is a POC and not yet published to npm, copy the `packages/plugin/src` folder into your project and install the one required dependency:

```bash
npm install -D magic-string
```

Then add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import webawesome from './src/index.ts' // adjust path to where you copied the src folder

export default defineConfig({
  plugins: [
    webawesome({ styles: true }), // styles: true injects the Web Awesome CSS automatically
  ],
})
```
