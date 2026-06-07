## 1. Refactor — Extract helpers to utils.ts

- [x] 1.1 Create `packages/plugin/src/utils.ts` and move `stripComments`, `extractTags`, `tagToImport`, and `resolveEntryFromHtml` into it as named exports
- [x] 1.2 Update `packages/plugin/src/index.ts` to import helpers from `./utils.js`
- [x] 1.3 Verify `npm run build` still produces a clean `dist/` with no type errors

## 2. Config — TypeScript and package.json

- [x] 2.1 Add `"erasableSyntaxOnly": true` to `packages/plugin/tsconfig.json`
- [x] 2.2 Extend `include` in `tsconfig.json` to `["src", "tests"]` so IDE and `tsc --noEmit` cover test files
- [x] 2.3 Add `"test": "node --test 'tests/**/*.test.ts'"` script to `packages/plugin/package.json`
- [x] 2.4 Add `"engines": { "node": ">=22.6" }` to `packages/plugin/package.json`

## 3. Tests — auto-import feature

- [x] 3.1 Create `packages/plugin/tests/auto-import.test.ts`
- [x] 3.2 Test: single `<wa-button>` → correct import prepended
- [x] 3.3 Test: multiple distinct tags → one import each
- [x] 3.4 Test: repeated tag → deduplicated to one import
- [x] 3.5 Test: no `wa-*` tags → `transform` returns `null`
- [x] 3.6 Test: disallowed extension (`.css`) → `null`
- [x] 3.7 Test: `id` contains `node_modules` → `null`
- [x] 3.8 Test: tag in line comment (`//`) → not imported
- [x] 3.9 Test: tag in JSX comment (`{/* */}`) → not imported
- [x] 3.10 Test: tag in block comment (`/* */`) → not imported
- [x] 3.11 Test: transformed file includes a non-null `map`
- [x] 3.12 Test: `.vue` file → `moduleType: 'js'`
- [x] 3.13 Test: `.svelte` file → `moduleType: 'js'`

## 4. Tests — styles-injection feature

- [x] 4.1 Create `packages/plugin/tests/styles-injection.test.ts`
- [x] 4.2 Test: `webawesome()` (no options) → no CSS import on any file
- [x] 4.3 Test: `webawesome({ styles: true })` → CSS import prepended to entry file
- [x] 4.4 Test: `styles: true` + non-entry file → no CSS import
- [x] 4.5 Test: entry resolved from `config.build.rolldownOptions.input`
- [x] 4.6 Test: entry falls back to `index.html` — write temp file in `before()`, clean up in `after()`

## 5. Verify

- [x] 5.1 Run `npm test` in `packages/plugin/` — all tests pass
- [x] 5.2 Run `npm run build` — `dist/` is unchanged (no helpers leaked into public types)
