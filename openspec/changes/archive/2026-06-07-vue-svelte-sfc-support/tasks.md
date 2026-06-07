## 1. Comment stripping

- [x] 1.1 Add `<!-- ... -->` HTML comment stripping to `stripComments()` in `packages/plugin/src/index.ts`

## 2. SFC transform fix

- [x] 2.1 Remove `moduleType: 'js'` from the transform return value for `.vue` and `.svelte` files
- [x] 2.2 Add helper to detect SFC files (`.vue` or `.svelte` extension check)
- [x] 2.3 Implement `<script>` block injection: match `/<script\b[^>]*>/`, insert imports via `s.prependLeft` after the opening tag
- [x] 2.4 Implement fallback: when no `<script>` block found in an SFC, call `s.prepend('<script>\n' + imports + '\n</script>\n')`

## 3. Test updates

- [x] 3.1 Update existing `.vue` transform test: assert `moduleType === undefined` and that imports appear inside the `<script>` block
- [x] 3.2 Update existing `.svelte` transform test: same assertions as 3.1
- [x] 3.3 Add test: Vue SFC with `<script setup>` — imports injected inside the block
- [x] 3.4 Add test: Vue SFC with no `<script>` block — minimal `<script>` block prepended
- [x] 3.5 Add test: Svelte SFC with `<script>` block — imports injected correctly
- [x] 3.6 Add test: HTML comment stripping — `<!-- <wa-button> -->` produces no import
