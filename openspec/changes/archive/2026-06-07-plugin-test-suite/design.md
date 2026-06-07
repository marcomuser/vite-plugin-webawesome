## Context

The plugin is a single-file Vite transform. All helpers (`stripComments`, `extractTags`, `tagToImport`, `resolveEntryFromHtml`) are currently module-private. The existing specs in `openspec/specs/` already define every testable scenario. The project is on Node 24, which ships native TypeScript type stripping — no test framework is required.

## Goals / Non-Goals

**Goals:**
- Cover every scenario in the existing `auto-import` and `styles-injection` specs with a `node:test` test
- Zero new dependencies (runtime or dev)
- Tests run with a single `npm test` command in `packages/plugin/`
- Test files are type-checked by the existing tsconfig

**Non-Goals:**
- Code coverage reporting
- Watch mode
- End-to-end Vite dev-server tests
- Testing the `@awesome.me/webawesome` package

## Decisions

### D1 — Extract helpers to `src/utils.ts`

**Choice:** Move `stripComments`, `extractTags`, `tagToImport`, and `resolveEntryFromHtml` to a new `src/utils.ts` and export them. Re-import in `src/index.ts`.

**Why:** Tests can import helpers directly for precise unit assertions. Keeping them private forces all tests to go through `plugin.transform()`, making it harder to isolate which helper caused a regression.

**Alternative considered:** Export helpers from `index.ts` — rejected because it mixes internal utilities with the public plugin API.

### D2 — `node:test` + native type stripping, zero extra deps

**Choice:** Run tests with `node --test 'tests/**/*.test.ts'`. Node 24 strips TypeScript types natively (no `--strip-types` flag needed for `.ts` files when invoked via `--test`).

**Why:** The project goal is minimal dependencies. `node:test` and `node:assert` are built-ins. `vite` is the only existing devDep and is not needed at test time.

**Alternative considered:** Vitest — excellent DX, but one extra dependency and heavier setup.

### D3 — `erasableSyntaxOnly: true` in existing tsconfig

**Choice:** Add `"erasableSyntaxOnly": true` to `packages/plugin/tsconfig.json` and extend `include` to `["src", "tests"]`.

**Why:** `erasableSyntaxOnly` guarantees all TypeScript syntax is compatible with Node's type stripper (no enums, namespaces, parameter properties). The plugin already conforms. Extending `include` to `tests/` gives IDE type-checking on test files without a second tsconfig.

### D4 — One test file per spec

**Choice:** `tests/auto-import.test.ts` and `tests/styles-injection.test.ts`, mirroring `openspec/specs/`.

**Why:** When a spec changes, the matching test file is immediately obvious. Each file can be run in isolation.

### D5 — `resolveEntryFromHtml` test uses a real temp file

**Choice:** Write a minimal `index.html` to `os.tmpdir()` in `before()`, assert, clean up in `after()`.

**Why:** `resolveEntryFromHtml` calls `readFileSync` — no abstraction to mock. A real temp file is simpler and more reliable than a mock.

## Risks / Trade-offs

- **Node version lock-in** → tests depend on Node 24 native type stripping. Add a `"engines": { "node": ">=22.6" }` guard to `packages/plugin/package.json` to communicate the minimum.
- **No watch mode** → `node --test` has a `--watch` flag; users can add it manually if needed during development.
- **`utils.ts` becomes semi-public** → helper exports are importable by consumers. Acceptable trade-off; they carry no breaking-change risk since they are pure string/path functions.
