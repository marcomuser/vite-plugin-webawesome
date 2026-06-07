# vite-plugin-webawesome

> **Proof of concept** — ideally this plugin should eventually live in the [Web Awesome](https://github.com/shoelace-style/webawesome) repository itself.

A Vite plugin for [Web Awesome](https://www.npmjs.com/package/@awesome.me/webawesome) that auto-imports component definitions on use. Drop `<wa-*>` tags into your markup and they just work like native HTML elements. The plugin scans each source file for `<wa-*>` usage and prepends the matching side-effect import (e.g. `<wa-button>` → `import '@awesome.me/webawesome/dist/components/button/button.js'`). An optional `styles: true` flag injects the Web Awesome CSS bundle at the app entry point. Supports `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, and `.svelte`.

## Usage

Install the plugin:

```bash
npm install -D vite-plugin-webawesome
```

Then add it to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { webawesome } from 'vite-plugin-webawesome'

export default defineConfig({
  plugins: [
    webawesome({ styles: true }), // styles: true injects the Web Awesome CSS automatically
  ],
})
```
