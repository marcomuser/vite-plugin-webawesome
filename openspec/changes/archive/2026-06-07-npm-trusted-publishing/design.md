## Context

`vite-plugin-webawesome` has no CI/CD today. The publishable package lives at `packages/plugin/` in an npm workspace monorepo. The repo is public at `github.com/marcomuser/vite-plugin-webawesome`. The package is not yet on npm — a one-time manual publish is required before OIDC can be configured.

npm Trusted Publishing (OIDC) lets a GitHub Actions job exchange a short-lived GitHub identity token for a scoped npm publish token at runtime. No long-lived secret is stored in the repo.

## Goals / Non-Goals

**Goals:**
- Publish `vite-plugin-webawesome` to npm via OIDC on every GitHub Release
- Run type-check and tests before publish to block bad releases
- Attach npm provenance to every published version

**Non-Goals:**
- Automated version bumping (versions are bumped manually in `packages/plugin/package.json`)
- Changelog generation
- Publishing any other package in the monorepo

## Decisions

### Trigger: GitHub Release published

Using `release: types: [published]` rather than a raw tag push. The GitHub Release UI is where the human writes release notes and confirms intent — the workflow fires only after that step, not on every tag.

_Alternatives considered:_ `push: tags: ['v*.*.*']` — simpler but doesn't tie publish to an explicit human release action.

### Build inside CI, never commit `dist/`

`dist/` is already covered by the global `dist` entry in `.gitignore`. The workflow runs `npm run build` in `packages/plugin` before publishing. CI is the authoritative build environment.

### Workflow filename: `publish.yml`

This value is registered verbatim in the npm Trusted Publisher entry. Conventional, unambiguous, and matches the npm docs examples.

### `--provenance` flag enabled

Requires `id-token: write` (same permission already needed for OIDC). Attaches a signed SLSA attestation linking the npm package to the exact commit and Actions run. No downside.

### No GitHub Environment

An approval-gated environment adds friction for a single-developer plugin. Can be added later if needed.

### Monorepo publish path

The workflow uses `working-directory: packages/plugin` for the build and publish steps rather than `npm -w vite-plugin-webawesome publish` from the root, to keep the workflow readable and avoid workspace resolution edge cases.

## Risks / Trade-offs

[First publish is manual] → The OIDC trusted publisher entry cannot be created until the package exists on npm. The first publish must be done locally with `npm publish --access public` from `packages/plugin/`. All subsequent publishes use the workflow.

[Workflow filename is load-bearing] → If `publish.yml` is ever renamed, the npm Trusted Publisher entry must be updated to match, or publishes will fail with an authorization error.

[No version validation in CI] → The workflow does not assert that the `package.json` version matches the git tag. A mismatch (e.g. tag `v0.2.0` with version `0.1.0` still in `package.json`) will publish the wrong version. Mitigation: the release checklist (documented in tasks) includes a version-bump commit before tagging.

## Migration Plan

1. Build and publish v0.1.0 manually from `packages/plugin/`: `npm publish --access public`
2. Configure npm Trusted Publisher on npmjs.com: owner `marcomuser`, repo `vite-plugin-webawesome`, workflow `publish.yml`
3. Merge the `publish.yml` workflow to `main`
4. Cut the next release via GitHub Releases UI — workflow fires automatically
