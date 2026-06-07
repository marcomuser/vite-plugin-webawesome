## 1. Fix HMR query param stripping in transform hook

- [x] 1.1 In `src/index.ts`, extract `rawId = id.split('?')[0]` before computing `ext` and reuse it for the `isEntry` comparison
- [x] 1.2 Verify `const isEntry = options.styles && entryFilePath !== null && rawId === entryFilePath` replaces the old `id === entryFilePath`

## 2. Fix `resolveEntryFromHtml` attribute-order regex

- [x] 2.1 In `src/utils.ts`, replace the ordered-attribute regex with `/<script\b(?=[^>]*\btype="module")[^>]*\bsrc="([^"]+)"/` in `resolveEntryFromHtml`

## 3. Add regression tests

- [x] 3.1 In `tests/styles-injection.test.ts`, add a test: entry file ID with `?t=<timestamp>` query still receives CSS import
- [x] 3.2 In `tests/styles-injection.test.ts`, add a test: non-entry file ID with `?t=<timestamp>` query does NOT receive CSS import
- [x] 3.3 In `tests/styles-injection.test.ts`, add a test: `resolveEntryFromHtml` matches `<script src="..." type="module">` (src before type)
- [x] 3.4 Confirm all existing tests still pass (`npm test`)

## 4. Fix stale spec conflict in plugin-test-suite

- [x] 4.1 In `openspec/specs/plugin-test-suite/spec.md`, consolidate this spec to represent the testing setup. All implementation details should be specified by the other existing feature specs.
