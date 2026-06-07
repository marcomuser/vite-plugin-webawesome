## Why

The plugin currently breaks Vue and Svelte SFC files: it prepends bare `import` statements to the raw file (invalid SFC syntax) and returns `moduleType: 'js'` (which tells Vite to skip the framework compiler entirely). Neither `.vue` nor `.svelte` files are ever compiled correctly today.

## What Changes

- Remove `moduleType: 'js'` from transform results for `.vue` and `.svelte` files so the Vue / Svelte compilers run normally
- For SFC files, inject side-effect imports after the opening `<script` tag (using MagicString) instead of prepending to the file root
- When no `<script>` block exists in an SFC, prepend a minimal `<script>\n…\n</script>` block before the rest of the file
- Add HTML comment stripping (`<!-- ... -->`) to `stripComments()` to prevent spurious imports from commented-out template tags
- Update existing tests that assert `moduleType === 'js'` to assert `moduleType === undefined` and that imports appear inside the `<script>` block

## Capabilities

### New Capabilities

- `sfc-script-injection`: Inject side-effect imports into the `<script>` block of `.vue` and `.svelte` SFC files, preserving valid SFC syntax so the downstream framework compiler can process the file normally

### Modified Capabilities

- `auto-import`: The comment-stripping behavior gains HTML comment support (`<!-- ... -->`); the transform no longer sets `moduleType: 'js'` for SFC files

## Impact

- `packages/plugin/src/index.ts`: transform hook — SFC branch injection logic, `moduleType` removal, `stripComments` HTML comment extension
- Test suite: existing `.vue` / `.svelte` transform tests updated; new tests for SFC injection
- No new npm dependencies (MagicString already used)
- No breaking changes for users; fixes previously broken `.vue` / `.svelte` support
