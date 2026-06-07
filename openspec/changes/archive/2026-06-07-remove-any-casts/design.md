## Context

The plugin source has two casts in `configResolved` (`index.ts:23-27`) that were written before Vite 8 types were fully confirmed, plus two manual hook-type casts and a duplicated `TransformResult` alias across both test files. Vite 8's `ResolvedBuildOptions` already exposes `rolldownOptions` without needing `as any`, and Vite exports `HookHandler<T>` to derive hook function types without manual signatures.

## Goals / Non-Goals

**Goals:**
- Remove `as any` from `index.ts` by relying on Vite 8's `ResolvedBuildOptions`
- Remove `as string` from `index.ts` via a type-narrowing guard (option D from exploration)
- Replace `config: any` in `styles-injection.test.ts` with `HookHandler` + `ResolvedConfig`
- Replace manual `plugin.transform` cast in both test files with `HookHandler<NonNullable<Plugin['transform']>>`
- Drop the duplicated `TransformResult` alias from both test files

**Non-Goals:**
- Changing any runtime behavior or plugin API
- Migrating the test setup away from its current pattern
- Adding strict `noUncheckedIndexedAccess` or other tsconfig strictness flags

## Decisions

### Keep `?.` on `rolldownOptions`

Access as `config.build.rolldownOptions?.input` rather than `config.build.rolldownOptions.input`.

`Required<BuildOptions>` makes `rolldownOptions` non-optional at the type level, but that is a type-level promise — Vite may not always fulfil it at runtime (e.g., older minor versions, partial builds). The optional chain costs nothing and prevents a potential `TypeError`.

### Type-narrowing guard for `Object.values(rolldownInput)[0]`

```typescript
const values = Object.values(rolldownInput)
if (!values[0]) return
raw = values[0]  // narrowed to string
```

After the `if (!values[0])` guard, TypeScript narrows `values[0]` to `string`. This is semantically correct: when the rolldown input list is empty, there is no entry file to resolve.

Alternative considered: non-null assertion `values[0]!` — trades one cast for another with no real improvement.

### `HookHandler` pattern for test files

Vite exports `HookHandler<T>` (`T extends ObjectHook<infer H> ? H : T`) which unwraps an `ObjectHook`-wrapped hook type to the bare function type. Using it:

```typescript
type ConfigResolvedFn = HookHandler<NonNullable<Plugin['configResolved']>>
type TransformFn      = HookHandler<NonNullable<Plugin['transform']>>
```

Call-site partial mocks are cast with `as ResolvedConfig` (structural cast, not `any`). This is honest about what it is while removing `any` from the API boundary.

### Drop `TransformResult` local alias

Once `TransformFn` is derived via `HookHandler`, the return type is inferred. The `TransformResult` alias in both test files becomes dead code and is removed.

## Risks / Trade-offs

- **`HookHandler` is internal-ish** → It is exported from `vite/dist/node/index.d.ts` and has been stable across Vite 5–8. If it's ever removed, the fix is just to inline the conditional type. Low risk.
- **Partial mock casts (`as ResolvedConfig`)** → Still structurally unsound, but the type error is now at the mock, not buried in a helper parameter. Easier to spot and fix.
- **No behavior change** → No rollback plan needed; the change is purely additive at the type level.
