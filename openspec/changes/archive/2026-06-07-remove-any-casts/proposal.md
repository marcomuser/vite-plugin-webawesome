## Why

The plugin source and test files contain two `any` casts and one `as string` cast that suppress legitimate TypeScript errors. Removing them improves long-term type safety and ensures the code stays correct as Vite and rolldown types evolve.

## What Changes

- Remove `(config.build as any)` in `index.ts:23` — access `config.build.rolldownOptions` directly via Vite 8's `ResolvedBuildOptions`
- Replace `(Object.values(rolldownInput)[0] as string)` in `index.ts:27` with a type-narrowing guard
- Replace `config: any` and `as (config: any) => void` in `styles-injection.test.ts` with `HookHandler<NonNullable<Plugin['configResolved']>>` and `ResolvedConfig`
- Replace manual `plugin.transform` casts in both test files with `HookHandler<NonNullable<Plugin['transform']>>`
- Drop locally-defined `TransformResult` aliases from both test files (made obsolete by `HookHandler`)

## Capabilities

### New Capabilities

_None — this change only improves internal type safety; no new user-facing capabilities are introduced._

### Modified Capabilities

_None — no spec-level behavior changes. All modifications are implementation-only (type annotations and casts)._

## Impact

- **`packages/plugin/src/index.ts`**: two cast removals in `configResolved` hook
- **`packages/plugin/tests/auto-import.test.ts`**: cast cleanup, `TransformResult` alias removed
- **`packages/plugin/tests/styles-injection.test.ts`**: `config: any` replaced with proper types, `TransformResult` alias removed
- **No API or runtime behavior changes** — this is a pure type-safety improvement
