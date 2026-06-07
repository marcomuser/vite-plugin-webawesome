## Why

Two bugs in the plugin's `transform` hook cause silent failures in real Vite workflows: CSS injection breaks after HMR reloads because Vite appends query params to module IDs, and the `index.html` fallback entry resolver fails when `src` comes before `type="module"` in the script tag — a valid but unhandled attribute order.

## What Changes

- Strip query params from `id` before comparing against `entryFilePath` in the `transform` hook, so CSS injection survives HMR
- Fix `resolveEntryFromHtml` regex to match `<script type="module">` regardless of attribute order

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `styles-injection`: Two requirement scenarios now require correct behaviour: entry detection must be robust to HMR query params, and the `index.html` fallback must handle any attribute ordering on the `<script>` tag
- `plugin-test-suite`: Consolidate to cover only testing infrastructure (helper exports, zero new deps, meta-level coverage contract); remove duplicated behavioural scenarios that belong in the feature specs, including two stale `moduleType: 'js'` scenarios for Vue/Svelte files

## Impact

- `packages/plugin/src/index.ts`: one-line fix to `isEntry` derivation
- `packages/plugin/src/utils.ts`: regex fix in `resolveEntryFromHtml`
- `packages/plugin/tests/styles-injection.test.ts`: add regression tests for both scenarios
- `openspec/specs/plugin-test-suite/spec.md`: spec consolidation (no code change)
- No API changes, no new dependencies
