# Exploration: Remove `any` and casts in plugin source

**Date:** 2026-06-07
**Linked change:** none

## Context

The plugin source (`packages/plugin/src/index.ts`) has two type-unsafe spots: a `as any` cast to access `config.build.rolldownOptions`, and an `as string` cast when extracting the first value from the rolldown input option. The goal is to check whether these can be removed cleanly using the actual Vite 8 / rolldown types.

## Observations

### Cast inventory

Two casts in `index.ts`, zero in `utils.ts`:

```
Line 23: (config.build as any).rolldownOptions?.input
Line 27: (Object.values(rolldownInput)[0] as string)
```

### `as any` on `config.build` (line 23)

`config.build` is typed as `ResolvedBuildOptions` in Vite 8:

```typescript
// vite/dist/node/index.d.ts (line 2253)
interface ResolvedBuildOptions
  extends Required<Omit<BuildOptions, "polyfillModulePreload">> {
  modulePreload: false | ResolvedModulePreloadOptions
}

// BuildOptions (= BuildEnvironmentOptions) has:
rolldownOptions?: RolldownOptions   // line 2097
```

Because `ResolvedBuildOptions` uses `Required<...>`, `rolldownOptions` becomes non-optional: `rolldownOptions: RolldownOptions`. This means `config.build.rolldownOptions` is directly accessible — **the `as any` cast is unnecessary in Vite 8 types**.

However, `RolldownOptions.input` is still optional (`input?: InputOption`), so `config.build.rolldownOptions.input` is `InputOption | undefined` — the `?.` in the original code is not needed (TS may warn about it being unnecessary on non-optional `rolldownOptions`), but accessing `.input` directly is safe via a plain `if` check.

Concretely, line 23 can become:

```typescript
const rolldownInput = config.build.rolldownOptions?.input
// or: config.build.rolldownOptions.input  (since rolldownOptions is Required<...>)
```

### `as string` cast (line 27)

`InputOption` is defined in rolldown as:

```typescript
type InputOption = string | string[] | Record<string, string>
```

The branch at line 27 reaches `Object.values(rolldownInput)[0]` after `typeof rolldownInput === 'string'` has been false — so `rolldownInput` is `string[] | Record<string, string>`.

`Object.values()` on either of those produces `string[]`, so `[0]` is typed as `string | undefined` by TypeScript — the `as string` cast just silences the `undefined` possibility.

Options to remove it cleanly:

```
A) Destructure:  const [first] = Object.values(rolldownInput)   → still string | undefined
B) Non-null assertion:  Object.values(rolldownInput)[0]!        → trades `as string` for `!`, minimal improvement
C) Fallback:  (Object.values(rolldownInput)[0] ?? '')           → but we immediately pass it to resolve(), returning '' is wrong
D) Early guard:  const values = Object.values(rolldownInput); if (!values[0]) return; raw = values[0]
E) Keep `as string` + comment explaining why it's safe         → honest but still a cast
```

Option D is the most type-safe: after the guard, TypeScript narrows `values[0]` to `string`. It also means `entryFilePath` is set only when a non-empty string is found, which is the correct semantic.

### ASCII flow

```
configResolved()
  └─ options.styles?
       ├─ rolldownOptions.input present?
       │    ├─ string → entryFilePath = resolve(root, raw)
       │    └─ string[] | Record → Object.values(…)[0] ← cast lives here
       └─ else → resolveEntryFromHtml()
```

### Summary of changes needed

| Location | Cast | Removable? | Approach |
|---|---|---|---|
| `index.ts:23` | `as any` | ✅ Yes | Direct property access on `ResolvedBuildOptions` |
| `index.ts:27` | `as string` | ✅ Yes | Type-narrowing guard before use |

---

## Rounds

## Round 1 — Handling the `as string` cast

### Q1.1 — Guard approach vs assertion

After removing `as any` on line 23, line 27's `as string` is the only remaining cast. The cleanest removal is a guard that checks `values[0]` before using it (option D above). Should we apply that guard, or use a simpler `!` non-null assertion?

- [x] Guard (option D): `const values = Object.values(rolldownInput); if (!values[0]) return; raw = values[0]` ← recommended: fully type-safe, correct semantics (no entry when input is empty)
- [ ] Non-null assertion `!`: swaps one cast for another, no real improvement
- [ ] Keep `as string` with a comment: honest but leaves a cast in place

> **Your answer / freetext:**
>

### Q1.2 — Optional chain on `rolldownOptions`

With `as any` gone, `config.build.rolldownOptions` is typed as `RolldownOptions` (required by `Required<...>`). TS may flag `?.` as unnecessary on a non-optional property. Should we keep `?.` for runtime safety, or use plain `.` with just `if (rolldownInput)` guarding `input`?

- [x] Keep `?.` — `Required<T>` is a type-level promise Vite may not always fulfil at runtime; the optional chain costs nothing ← recommended: defensive
- [ ] Plain `.` — trust the types, remove the chain operator

> **Your answer / freetext:**
>

## Round 2 — Type issues in the test suite

### Q2.1 — `config: any` in `callConfigResolved`

`styles-injection.test.ts` declares `callConfigResolved(plugin, config: any)` and the inner cast is also `as (config: any) => void`. Vite exports `HookHandler<T>` (a utility that strips the `ObjectHook` wrapper: `T extends ObjectHook<infer H> ? H : T`), and `ResolvedConfig`.

Using both removes the `any` entirely:

```typescript
import type { Plugin, HookHandler, ResolvedConfig } from 'vite'

type ConfigResolvedFn = HookHandler<NonNullable<Plugin['configResolved']>>
// resolves to: (config: ResolvedConfig) => void | Promise<void>

function callConfigResolved(
  plugin: ReturnType<typeof webawesome>,
  config: ResolvedConfig,
): void {
  (plugin.configResolved as ConfigResolvedFn)(config)
}
```

Call sites then use a cast on the partial mock: `{ root: '/app', build: {} } as ResolvedConfig`. The `any` moves to a proper structural cast — still unsound, but honest about what it is.

Should we make this change?

- [x] Yes — use `HookHandler` + `ResolvedConfig`, cast partials at call sites ← recommended: removes `any`, derives types from Vite's own API
- [ ] No — `config: any` is fine in tests; not worth the import noise

> **Your answer / freetext:**
>

### Q2.2 — Plugin hook cast for `transform`

Both test files cast `plugin.transform` by hand: `as (src: string, id: string) => TransformResult`. This duplicates the Vite API signature and will silently go stale if the signature changes.

The same `HookHandler` pattern gives a derived type:

```typescript
type TransformFn = HookHandler<NonNullable<Plugin['transform']>>
// resolves to the actual Vite transform hook function type
```

The local `TransformResult` alias can then be replaced with the inferred return type, or dropped entirely if the tests only use the result's `.code` and `.map` properties. Should we apply `HookHandler` here too?

- [x] Yes — derive via `HookHandler<NonNullable<Plugin['transform']>>` and drop the manual signature ← recommended: single source of truth for the hook type
- [ ] No — the manual cast is more readable for test readers; don't change it

> **Your answer / freetext:**
>

### Q2.3 — Duplicated `TransformResult` type

Both `auto-import.test.ts:5` and `styles-injection.test.ts:8` define an identical local type:

```typescript
type TransformResult = { code: string; map: unknown; moduleType?: string } | null
```

If we adopt Q2.2's approach (derive from `HookHandler`), this local alias becomes unnecessary in both files. If we don't, the duplication is worth addressing. Options:

- [x] Let Q2.2's approach make it obsolete — if we switch to `HookHandler`, we don't need it at all ← recommended: resolves itself
- [ ] Extract to `tests/helpers.ts` and import in both — if we keep the manual cast, share the type

> **Your answer / freetext:**
>

## Insights & Decisions

_Decision:_ Remove `(config.build as any)` on `index.ts:23` — access `config.build.rolldownOptions` directly. — _Reason:_ Vite 8's `ResolvedBuildOptions` already includes `rolldownOptions` via `Required<BuildOptions>`, making the cast unnecessary.

_Decision:_ Keep `?.` on `rolldownOptions` (i.e. `config.build.rolldownOptions?.input`). — _Reason:_ `Required<T>` is a type-level promise Vite may not always fulfil at runtime; defensive optional chaining costs nothing.

_Decision:_ Replace `(Object.values(rolldownInput)[0] as string)` on `index.ts:27` with a type-narrowing guard (option D: extract to `values`, guard on `values[0]`, then use it). — _Reason:_ After the guard, TypeScript narrows to `string` with no cast; also correctly skips setting `entryFilePath` when the input list is empty.

_Decision:_ In `styles-injection.test.ts`, replace `config: any` and the inner `as (config: any) => void` with `HookHandler<NonNullable<Plugin['configResolved']>>` and `ResolvedConfig`; cast partial mock objects at call sites with `as ResolvedConfig`. — _Reason:_ Removes `any`, derives the hook signature from Vite's own API so it stays correct across version bumps.

_Decision:_ In both test files, replace the manual `plugin.transform as (src: string, id: string) => TransformResult` cast with `HookHandler<NonNullable<Plugin['transform']>>`. — _Reason:_ Single source of truth for the hook signature; will not silently go stale if Vite's transform API changes.

_Decision:_ Drop the locally-defined `TransformResult` alias from both test files. — _Reason:_ Becomes obsolete once `HookHandler` is used; the inferred return type of `TransformFn` carries all needed information.
