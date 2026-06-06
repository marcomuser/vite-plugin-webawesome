## ADDED Requirements

### Requirement: Plugin accepts a styles option to enable global CSS injection
The plugin SHALL accept an options object `{ styles?: boolean }`. When `styles` is `true`, the plugin SHALL inject `import '@awesome.me/webawesome/dist/styles/webawesome.css'` into the application entry file. When `styles` is `false` or omitted, no CSS injection SHALL occur.

#### Scenario: styles option defaults to disabled
- **WHEN** the plugin is registered as `webawesome()` with no arguments
- **THEN** no CSS import is injected into any file

#### Scenario: styles option enables injection
- **WHEN** the plugin is registered as `webawesome({ styles: true })`
- **THEN** the CSS import is injected into the entry file

### Requirement: CSS import is injected into the Vite entry file exactly once
When `styles: true`, the plugin SHALL inject the CSS import only into the file that Vite resolves as the application entry point. The CSS import SHALL NOT be injected into any other file.

#### Scenario: CSS injected into entry file
- **WHEN** `styles: true` and the transform processes the app entry file (e.g., `src/main.tsx`)
- **THEN** `import '@awesome.me/webawesome/dist/styles/webawesome.css'` is prepended to that file

#### Scenario: CSS not injected into non-entry files
- **WHEN** `styles: true` and the transform processes any file other than the entry (e.g., `src/App.tsx`)
- **THEN** no CSS import is added to that file

### Requirement: Entry file is resolved via configResolved
The plugin SHALL determine the entry file path using Vite's `configResolved` hook, reading `config.build.rolldownOptions.input` (the Vite 8 / Rolldown config key). If `input` is not set, the plugin SHALL fall back to resolving `index.html` relative to `config.root`.

#### Scenario: Custom entry is detected
- **WHEN** `vite.config.ts` sets `build.rolldownOptions.input` to `'src/main.tsx'`
- **THEN** the resolved entry path matches `src/main.tsx` (absolute)

#### Scenario: Default entry falls back to index.html resolution
- **WHEN** no `rollupOptions.input` is configured
- **THEN** the plugin resolves the entry from `index.html` in the project root
