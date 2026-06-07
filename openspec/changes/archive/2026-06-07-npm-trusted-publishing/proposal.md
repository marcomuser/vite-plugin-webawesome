## Why

`vite-plugin-webawesome` is ready to be published to npm, but no CI/CD pipeline exists yet. Setting up npm Trusted Publishing (OIDC) eliminates the need to store a long-lived npm token as a GitHub secret — the GitHub Actions workflow exchanges a short-lived identity token at publish time instead.

## What Changes

- Add `.github/workflows/publish.yml` — GitHub Actions workflow triggered on GitHub Release published
- Add type-check + test steps before publish to block bad releases
- Enable `--provenance` on `npm publish` for supply-chain attestation
- Add `dist/` entry to `.gitignore` for `packages/plugin` if not already covered

## Capabilities

### New Capabilities

- `npm-publish-workflow`: GitHub Actions workflow that builds, checks, and publishes `packages/plugin` to npm via OIDC on every GitHub Release

### Modified Capabilities

<!-- none -->

## Impact

- New file: `.github/workflows/publish.yml`
- No changes to plugin source code or runtime behaviour
- Requires a one-time manual `npm publish --access public` to create the package on npm before OIDC can be configured
- Requires a one-time npm Trusted Publisher entry: `marcomuser / vite-plugin-webawesome / publish.yml`
