# Exploration: plugin-test-suite

**Date:** 2026-06-07
**Linked change:** none

## Context

The `packages/plugin` package contains a single-file Vite plugin (`src/index.ts`) with no test coverage yet. The goal is to design a minimal, easy-to-maintain test suite focused on regression prevention, using as few dependencies as possible.

## Observations

### Plugin surface area

The plugin has two independent features, each with clear unit-testable pure functions and one integration-level hook:

```
webawesome(options)
│
├─ configResolved(config)          ← side effect: sets entryFilePath
│   ├─ reads rolldownOptions.input (Vite 8 / Rolldown path)
│   └─ falls back to resolveEntryFromHtml(root) → reads index.html
│
└─ transform(src, id)              ← pure-ish: returns { code, map } or null
    ├─ early-exit: ext not allowed → null
    ├─ early-exit: id in node_modules → null
    ├─ early-exit: no 'wa-' and not entry → null
    ├─ extractTags(src) → Set<string>
    │   └─ stripComments(src) → regex scan for <wa-*
    ├─ tagToImport(tag) → import string
    └─ prepends CSS import if isEntry
```

**Pure helper functions** (not exported, but testable via the transform output):
- `stripComments(src)` — removes JSX `{/* */}`, block `/* */`, and line `//` comments
- `extractTags(src)` — returns `Set<wa-*>` from a source string
- `tagToImport(tag)` — maps `wa-foo` → `import '@awesome.me/...'`
- `resolveEntryFromHtml(root)` — reads filesystem, returns path or null

**Key regression risks:**
1. Comment stripping misses an edge case → false positives in tag detection
2. Tags inside commented-out code get imported → unwanted side effects
3. `wa-` in attribute values or text nodes counted as tags (regex false positives)
4. Entry detection breaks when Vite config shape changes
5. `.vue` / `.svelte` files not getting `moduleType: 'js'`
6. `node_modules` files being transformed

### Testing approach options

**Option A — Node.js built-in test runner (`node:test`)**
- Available since Node 18, stable since Node 20; project uses Node 24
- Zero extra dependencies
- `node --test` runs `*.test.ts` files if TypeScript is pre-compiled, or with `--experimental-transform-types` flag (Node 22.6+)
- Assertions via `node:assert` (also built-in)

**Option B — Vitest**
- Industry standard for Vite-ecosystem projects
- Native TypeScript support (no compilation step needed)
- Built-in coverage, watch mode, and snapshot testing
- One dev dependency (`vitest`), but it pulls in `vite` which is already a devDep

**Option C — Custom inline scripts**
- No framework at all, plain JS assertions
- Maximum fragility, poor error messages
- Not recommended

### Node.js `--experimental-transform-types` availability

Node 24 supports `--experimental-transform-types` to strip TypeScript types at runtime, enabling `node --test --experimental-transform-types **/*.test.ts` without any build step. The flag is still marked experimental but is reliable for type-stripping (no type checking, just strips annotations).

### What "few dependencies" means in context

The plugin already has `vite` as a devDependency. Vitest would be one additional package. `node:test` needs zero additions but requires either:
1. Pre-compiling tests with `tsdown` (already installed), or
2. Using `--experimental-transform-types` (works, but experimental flag)

### What to test

**Unit tests** (pure functions, no Vite involved):
- `stripComments` with each comment style
- `extractTags` with tags, non-tags, and commented-out tags
- `tagToImport` mapping
- `resolveEntryFromHtml` with a temp file

**Integration tests** (call `transform` directly on the plugin instance):
- File extension allow/deny list
- `node_modules` skip
- Tag detection → correct prepended import
- Styles option: CSS import prepended to entry only
- Vue/Svelte files get `moduleType: 'js'`
- Source maps are returned
- Early exit returns `null` (no-op)

**What NOT to test:**
- Vite internals (plugin registration, hook wiring)
- The `@awesome.me/webawesome` package contents

### ASCII flow of a test call

```
test('transforms wa-button tag')
  │
  ├─ const plugin = webawesome()
  ├─ plugin.configResolved(mockConfig)   // set entryFilePath
  └─ const result = plugin.transform(src, '/app/src/Comp.tsx')
       │
       └─ assert result.code.includes("import '@awesome.me/.../button/button.js'")
```

---

## Rounds

## Round 1 — Test runner and TypeScript execution

### Q1.1 — Test runner choice

Which runner should power the suite? Both can cover the full feature surface.

- [ ] Vitest ← recommended: already in the Vite ecosystem, native TS support with zero config, one `npm install`; watch mode and coverage come for free; error output is much richer than `node:assert`
- [x] `node:test` + native Node.js type stripping ← **decided**: zero new deps; user confirmed they're happy with this approach and will use `erasableSyntaxOnly: true` in tsconfig to ensure TS syntax is compatible with Node's type stripper

### Q1.2 — Where should tests live?

- [ ] `packages/plugin/src/__tests__/` ← co-located with source, standard Vitest convention
- [x] `packages/plugin/tests/` ← separate top-level tests folder, cleaner separation

### Q1.3 — Should helpers (`stripComments`, `extractTags`, `tagToImport`) be exported for direct unit testing?

Currently they are module-private. Options:

- [x] Export from a separate `packages/plugin/src/utils.ts` and import in tests ← cleanest; helpers become part of the public contract but are easy to test and maintain independently
- [ ] Keep private, test only via `transform` output ← fewer exports but unit tests become harder to isolate; a bug in `extractTags` shows up only as a bad transform result
- [ ] Export with `/** @internal */` JSDoc from `index.ts` ← quick, but pollutes the main export

> **Your answer / freetext:**
>

## Round 2 — Structure, tsconfig, and spec alignment

The existing specs in `openspec/specs/auto-import/spec.md` and `openspec/specs/styles-injection/spec.md` already list every scenario. Each scenario maps directly to a test case.

### Q2.1 — Test file layout: one file or one per spec?

The two specs cover distinct features. Options:

- [x] One test file per spec feature ← recommended: `auto-import.test.ts` + `styles-injection.test.ts`; each file imports only what it needs, and it's easy to run one feature's tests in isolation (`node --test **/auto-import.test.ts`)
- [ ] Single `index.test.ts` ← simpler, but grows unwieldy as specs are added; harder to run one feature's tests only

### Q2.2 — tsconfig: add `erasableSyntaxOnly` to existing config or create a separate test tsconfig?

`erasableSyntaxOnly: true` disallows enums, namespaces, and parameter properties — all of which are already absent from the plugin codebase. Options:

- [x] Add `erasableSyntaxOnly: true` to the existing `packages/plugin/tsconfig.json` ← recommended: the plugin code already conforms; one tsconfig is simpler; keeps type-checking in sync with test execution
- [ ] Add a separate `packages/plugin/tsconfig.test.json` that extends the main one ← useful only if you need looser rules in tests (you don't here)

### Q2.3 — How to invoke `node --test` with TypeScript source?

Node 22.6+ supports `--experimental-strip-types`; Node 24 stabilised it. Both strip types without type-checking.

- [x] `node --test 'src/**/*.test.ts'` ← no more flags needed with Node 24; add as `"test": "node --test 'src/**/*.test.ts'"` in `packages/plugin/package.json`
- [ ] `node --experimental-strip-types --test ...` ← Node 22 flag; not needed on Node 24

### Q2.4 — Should helpers be exported from `utils.ts` or kept in `index.ts`?

Exporting helpers from a separate file keeps the public API of `index.ts` clean (`webawesome`, `WebAwesomeOptions` only) and lets tests import helpers without going through the plugin factory.

- [x] Extract helpers to `src/utils.ts`, export them, re-use in `index.ts` ← recommended: clean public API, easy test imports
- [ ] Keep everything in `index.ts`, export helpers from there ← fewer files but mixes internal utilities with public API

## Insights & Decisions

_Decision:_ Use `node:test` with native Node 24 type stripping (no extra flags) — _Reason:_ zero new dependencies; Node 24 strips TypeScript types natively when running `.ts` files directly.

_Decision:_ Add `"erasableSyntaxOnly": true` to the existing `packages/plugin/tsconfig.json` — _Reason:_ a single tsconfig covers both compilation and type-checking; the plugin codebase already conforms (no enums, namespaces, or parameter properties).

_Decision:_ Tests live in `packages/plugin/tests/` — _Reason:_ clean separation from source; the `src/` directory stays build-only.

_Decision:_ One test file per spec feature (`tests/auto-import.test.ts` + `tests/styles-injection.test.ts`) — _Reason:_ mirrors the `openspec/specs/` structure; each spec scenario becomes a `test()` call in the corresponding file; easy to run one feature in isolation.

_Decision:_ Extract helpers (`stripComments`, `extractTags`, `tagToImport`, `resolveEntryFromHtml`) to `src/utils.ts`, re-import in `src/index.ts` — _Reason:_ keeps the public API of `index.ts` clean; tests import helpers directly for precise unit coverage.

_Implementation note:_ The `npm test` script should be `"node --test 'tests/**/*.test.ts'"` (not `src/**`). Add `"tests"` to the `include` array in `tsconfig.json` so the IDE and `tsc --noEmit` cover test files too.

_Implementation note:_ `resolveEntryFromHtml` reads the filesystem. Its test should write a minimal `index.html` to a `tmp` dir via `node:fs/promises` + `node:os.tmpdir()` and clean up in `after()` — no mocking needed.
