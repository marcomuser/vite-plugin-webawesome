## Why

The plugin has no test coverage, making it easy to introduce regressions silently. Adding a minimal suite that mirrors the existing specs gives confidence on every change without introducing new build-time dependencies.

## What Changes

- Extract `stripComments`, `extractTags`, `tagToImport`, and `resolveEntryFromHtml` from `src/index.ts` into a new `src/utils.ts` (exported)
- Re-import helpers in `src/index.ts`
- Add `packages/plugin/tests/auto-import.test.ts` covering all auto-import scenarios from the spec
- Add `packages/plugin/tests/styles-injection.test.ts` covering all styles-injection scenarios from the spec
- Add `"erasableSyntaxOnly": true` to `packages/plugin/tsconfig.json` and extend `include` to cover `tests/`
- Add `"test"` script to `packages/plugin/package.json`: `node --test 'tests/**/*.test.ts'`

## Capabilities

### New Capabilities

- `plugin-test-suite`: Regression test suite for the plugin using `node:test` and `node:assert`; zero new runtime or dev dependencies

### Modified Capabilities

<!-- No spec-level requirement changes — existing auto-import and styles-injection specs remain unchanged; the test suite validates what they already define -->

## Impact

- `packages/plugin/src/index.ts` — refactored to import helpers from `utils.ts`; no behaviour change
- `packages/plugin/src/utils.ts` — new file exporting pure helper functions
- `packages/plugin/tests/` — new test directory (not shipped in `dist/`)
- `packages/plugin/tsconfig.json` — `erasableSyntaxOnly: true`, extended `include`
- `packages/plugin/package.json` — new `test` script
- No new dependencies
- No breaking changes to the public API
