## Context

The `transform` hook in `src/index.ts` computes `isEntry` by comparing the raw `id` parameter against `entryFilePath`. In Vite's dev server, HMR invalidation re-processes modules with a timestamp query appended (e.g. `?t=1749293012345`), causing `id === entryFilePath` to evaluate to `false` and silently skipping CSS injection after the first hot reload.

The `resolveEntryFromHtml` utility in `src/utils.ts` uses the regex `/<script[^>]+type="module"[^>]+src="([^"]+)"/ ` which requires `type` to precede `src`. HTML attribute order is unspecified; both orderings are legal and produced by common tooling.

## Goals / Non-Goals

**Goals:**
- CSS injection via `styles: true` remains active after HMR reloads
- `resolveEntryFromHtml` matches `<script>` tags regardless of attribute order

**Non-Goals:**
- No changes to auto-import logic
- No changes to SFC injection behaviour
- No performance or API surface changes

## Decisions

### Strip query params from `id` before the `isEntry` comparison

The extension check already does `id.split('?')[0]`. Reuse the same pattern:

```ts
const rawId = id.split('?')[0]
const ext = extname(rawId)
// ...
const isEntry = options.styles && entryFilePath !== null && rawId === entryFilePath
```

Alternative considered: normalise `entryFilePath` to include a wildcard for query strings. Rejected — mutating the stored path adds complexity with no benefit.

### Use a lookahead-based regex in `resolveEntryFromHtml`

Replace the ordered-attribute regex with one that uses a lookahead to require `type="module"` anywhere in the tag, then captures `src`:

```ts
/<script\b(?=[^>]*\btype="module")[^>]*\bsrc="([^"]+)"/
```

The lookahead `(?=[^>]*\btype="module")` asserts the attribute is present without consuming it, letting `[^>]*\bsrc="([^"]+)"` then find `src` in any position.

Alternative considered: running two separate regex passes (one for type, one for src). Rejected — single-pass lookahead is cleaner and avoids double-matching.

## Risks / Trade-offs

- [Query param stripping] The `?` split is already used for `ext` — consistent, minimal change with no new behaviour surface.
- [Regex lookahead] Lookaheads are O(n²) in pathological inputs, but `<script>` tags in `index.html` are tiny; no practical performance concern.
