### Requirement: Plugin helpers are exported from a dedicated utils module
The plugin SHALL export `stripComments`, `extractTags`, `tagToImport`, and `resolveEntryFromHtml` from `src/utils.ts` so they can be unit-tested in isolation.

#### Scenario: Helpers importable from utils
- **WHEN** a test file imports from `../src/utils.js`
- **THEN** `stripComments`, `extractTags`, `tagToImport`, and `resolveEntryFromHtml` are available as named exports

### Requirement: Test suite runs with no new dependencies
The test suite SHALL use only `node:test` and `node:assert` (Node.js built-ins) and require no additional devDependencies beyond what is already in `packages/plugin/package.json`.

#### Scenario: npm test succeeds in a clean install
- **WHEN** `npm ci && npm test` is run in `packages/plugin/`
- **THEN** all tests pass without installing any package not already listed in `package.json`

### Requirement: Auto-import spec scenarios are covered by tests
Every scenario defined in `openspec/specs/auto-import/spec.md` SHALL have a corresponding test case in `tests/auto-import.test.ts`.

#### Scenario: Single component import injected
- **WHEN** `plugin.transform('<wa-button />', '/app/src/Comp.tsx')` is called
- **THEN** the returned `code` starts with `import '@awesome.me/webawesome/dist/components/button/button.js'`

#### Scenario: Multiple distinct components deduplicated
- **WHEN** source contains `<wa-button>` and `<wa-icon>` (each once)
- **THEN** exactly one import for `button.js` and one for `icon.js` are prepended

#### Scenario: Repeated tag produces one import
- **WHEN** `<wa-button>` appears three times in the source
- **THEN** exactly one `button.js` import is prepended

#### Scenario: File with no wa-* tags returns null
- **WHEN** source contains no `wa-` substring
- **THEN** `plugin.transform(src, id)` returns `null`

#### Scenario: Disallowed extension returns null
- **WHEN** `id` ends in `.css`
- **THEN** `plugin.transform(src, id)` returns `null`

#### Scenario: node_modules file returns null
- **WHEN** `id` contains `node_modules`
- **THEN** `plugin.transform(src, id)` returns `null`

#### Scenario: Tag inside line comment is ignored
- **WHEN** source is `// <wa-button>` with no other wa-button usage
- **THEN** no `button.js` import is prepended

#### Scenario: Tag inside JSX comment is ignored
- **WHEN** source is `{/* <wa-icon /> */}` with no other wa-icon usage
- **THEN** no `icon.js` import is prepended

#### Scenario: Tag inside block comment is ignored
- **WHEN** source is `/* <wa-badge> */` with no other wa-badge usage
- **THEN** no `badge.js` import is prepended

#### Scenario: Transformed file returns a source map
- **WHEN** a tag is detected and imports are injected
- **THEN** the returned object has a non-null `map` property

#### Scenario: Vue file gets moduleType js
- **WHEN** `id` ends in `.vue` and the source contains a `wa-*` tag
- **THEN** the returned object has `moduleType: 'js'`

#### Scenario: Svelte file gets moduleType js
- **WHEN** `id` ends in `.svelte` and the source contains a `wa-*` tag
- **THEN** the returned object has `moduleType: 'js'`

### Requirement: Styles-injection spec scenarios are covered by tests
Every scenario defined in `openspec/specs/styles-injection/spec.md` SHALL have a corresponding test case in `tests/styles-injection.test.ts`.

#### Scenario: styles option disabled by default — no CSS import
- **WHEN** `webawesome()` is called with no options and transform runs on the entry file
- **THEN** no CSS import is prepended

#### Scenario: styles: true injects CSS import into entry file
- **WHEN** `webawesome({ styles: true })` is configured and `plugin.transform(src, entryId)` is called
- **THEN** `import '@awesome.me/webawesome/dist/styles/webawesome.css'` is the first line of the output

#### Scenario: CSS not injected into non-entry files
- **WHEN** `styles: true` and transform processes a file that is not the entry
- **THEN** no CSS import appears in the output

#### Scenario: Entry resolved from rolldownOptions.input
- **WHEN** `configResolved` receives a config with `build.rolldownOptions.input = 'src/main.tsx'`
- **THEN** the plugin identifies `src/main.tsx` (absolute) as the entry

#### Scenario: Entry falls back to index.html resolution
- **WHEN** no `rolldownOptions.input` is set and a temp `index.html` exists with `<script type="module" src="/src/main.tsx">`
- **THEN** the plugin resolves the entry to the absolute path of `src/main.tsx`
