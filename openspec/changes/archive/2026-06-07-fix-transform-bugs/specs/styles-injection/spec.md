## MODIFIED Requirements

### Requirement: Entry file is resolved via configResolved
The plugin SHALL determine the entry file path using Vite's `configResolved` hook, reading `config.build.rolldownOptions.input` (the Vite 8 / Rolldown config key). If `input` is not set, the plugin SHALL fall back to resolving `index.html` relative to `config.root`. The `index.html` fallback SHALL match `<script type="module">` tags regardless of the order in which `type` and `src` attributes appear.

#### Scenario: Custom entry is detected
- **WHEN** `vite.config.ts` sets `build.rolldownOptions.input` to `'src/main.tsx'`
- **THEN** the resolved entry path matches `src/main.tsx` (absolute)

#### Scenario: Default entry falls back to index.html resolution
- **WHEN** no `rolldownOptions.input` is configured
- **THEN** the plugin resolves the entry from `index.html` in the project root

#### Scenario: index.html with src before type is matched
- **WHEN** `index.html` contains `<script src="/src/main.tsx" type="module">`
- **THEN** the plugin resolves the entry to the absolute path of `src/main.tsx`

#### Scenario: index.html with type before src is matched
- **WHEN** `index.html` contains `<script type="module" src="/src/main.tsx">`
- **THEN** the plugin resolves the entry to the absolute path of `src/main.tsx`

## ADDED Requirements

### Requirement: CSS injection survives HMR query params on module IDs
When Vite's HMR appends a timestamp query string to module IDs (e.g. `?t=<timestamp>`), the plugin SHALL still inject the CSS import into the entry file by comparing the query-stripped module ID against the resolved entry path.

#### Scenario: Entry file re-processed with HMR timestamp query
- **WHEN** `styles: true`, the entry file is `src/main.tsx`, and Vite passes the module ID as `/app/src/main.tsx?t=1749293012345`
- **THEN** `import '@awesome.me/webawesome/dist/styles/webawesome.css'` is prepended to the output

#### Scenario: Non-entry file with query param is not injected
- **WHEN** `styles: true` and the transform processes `/app/src/Comp.tsx?t=1749293012345`
- **THEN** no CSS import is added to that file
