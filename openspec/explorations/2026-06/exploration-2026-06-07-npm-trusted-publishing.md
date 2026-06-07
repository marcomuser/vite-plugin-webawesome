# Exploration: npm Trusted Publishing

**Date:** 2026-06-07
**Linked change:** none

## Context

The `vite-plugin-webawesome` plugin (currently at v0.1.0) lives in a public GitHub monorepo and needs to be published to npm. The goal is to set up npm Trusted Publishing (OIDC) so that a GitHub Actions workflow can publish without storing a long-lived npm token as a secret.

## Observations

### Current state

```
vite-plugin-webawesome/          ← npm workspace root (private)
├── packages/
│   └── plugin/                  ← publishable: "vite-plugin-webawesome" v0.1.0
│       ├── src/index.ts
│       ├── dist/                ← "files": ["dist"]
│       └── package.json
└── .github/                     ← DOES NOT EXIST yet
```

No CI/CD is in place. The build tool is `tsdown`; `npm run build` in `packages/plugin` produces `dist/index.mjs` + `.d.ts` + sourcemaps.

### How npm Trusted Publishing works

npm Trusted Publishing uses OIDC — GitHub Actions exchanges a short-lived identity token for a scoped npm token at publish time. No secret needs to be stored in the repo.

```
GitHub Actions job
  │
  ├─ requests OIDC token from GitHub (id-token: write permission)
  │
  └─ npm publish ──OIDC──► npm registry
                            └─ validates: package name + repo + workflow path
```

Requirements on the npm side:
1. The package must already exist on npm (first publish is manual, or the trusted publisher must be configured before first publish).
2. A "Trusted Publisher" entry is created on the npm package settings page, linking: GitHub org/user + repo name + workflow filename + (optionally) environment name.

### Publish trigger options

| Trigger | Pros | Cons |
|---|---|---|
| `push` to version tag (`v*.*.*`) | Simple, one step | Tag push is not a "release" — changelog missing |
| GitHub Release published | Clean UX — changelog in release notes | Two steps: tag + create release |
| Manual `workflow_dispatch` | Full control | Not automatic |

### Monorepo consideration

Because the publishable package is in `packages/plugin/`, the workflow must either:
- `cd packages/plugin && npm publish`, or
- use `npm -w vite-plugin-webawesome publish` from the root

The `npm publish` command must run where `package.json` names the right package. The `--provenance` flag (npm 9+) is also available to attach a signed SBOM-style attestation.

### Version bump strategy

npm Trusted Publishing handles the *token*, not the *version*. A separate decision is needed for how versions are bumped:
- **Manual**: dev edits `package.json`, commits, tags, publishes.
- **Automated (changesets / semantic-release)**: PR-based changelog workflow.

Given v0.1.0 and a small team, manual is simplest to start.

---

## Rounds

## Round 1 — Workflow trigger and release process

### Q1.1 — What should trigger the publish workflow?

The workflow can fire on a git tag push, a GitHub Release creation, or manually.

- [x] GitHub Release published (`release: types: [published]`) ← recommended: cleanest UX — tag + release notes created together in GitHub UI, then the workflow fires
- [ ] Tag push (`push: tags: ['v*.*.*']`) — simpler but no release notes step
- [ ] Manual `workflow_dispatch` — full control, nothing automatic

> **Your answer / freetext:**
>

### Q1.2 — Should the workflow include a build step, or assume `dist/` is committed?

`dist/` is currently not in `.gitignore` (not checked — but common practice is to not commit build artifacts).

- [x] Build inside the workflow (`npm run build` before `npm publish`) ← recommended: dist is never committed, CI is the source of truth
- [ ] Commit `dist/` to the repo — simpler workflow but pollutes git history

> **Your answer / freetext:**
>

### Q1.3 — Should npm provenance be enabled (`--provenance` flag)?

Provenance attaches a signed attestation linking the published package to the exact GitHub Actions run and commit. Requires `id-token: write` (same permission already needed for OIDC).

- [x] Yes, enable `--provenance` ← recommended: free extra supply-chain security signal, no downside
- [ ] No — keep it minimal

> **Your answer / freetext:**
>

### Q1.4 — Should a GitHub Environment be used?

npm Trusted Publishing can be scoped to a named GitHub Environment (e.g. `npm`), which lets you add required reviewers or deployment rules before publish.

- [ ] Yes, use a `npm` environment — adds a manual approval gate before publish
- [x] No environment for now ← recommended: keep it simple; can add later if needed

> **Your answer / freetext:**
>

## Round 2 — Workflow file details and pre-publish checks

### Q2.1 — What should the workflow filename be?

The filename is registered verbatim in the npm Trusted Publisher settings page. Once set it cannot be changed without re-registering.

- [x] `publish.yml` ← recommended: unambiguous, matches npm docs convention
- [ ] `release.yml` — readable but could mean "release" of anything
- [ ] `npm-publish.yml` — more explicit, no real advantage

> **Your answer / freetext:**
>

### Q2.2 — Should pre-publish checks run before `npm publish`?

The plugin has a type-check (`tsc --noEmit`) and a test script (`node --test`). Running them in CI catches regressions before a release goes live.

- [x] Yes — type-check + tests in the same job, before the publish step ← recommended: cheap safety net, no extra job needed
- [ ] Yes — as a separate required job so failures block the publish job
- [ ] No — trust local dev to have run them; keep the workflow minimal

> **Your answer / freetext:**
>

### Q2.3 — Is `vite-plugin-webawesome` already claimed on npm under your account?

The OIDC trusted publisher can only be configured after the package exists on npm. If it doesn't exist yet, the first publish must be done manually with `npm publish --access public` from your local machine.

- [ ] Yes, it already exists on npm under my account — I can configure Trusted Publishing immediately
- [x] No, not published yet — I'll do one manual publish first, then configure Trusted Publishing ← recommended path for new packages
- [ ] Not sure — I need to check

> **Your answer / freetext:**
>

## Insights & Decisions

_Decision:_ Trigger the publish workflow on GitHub Release published (`release: types: [published]`) — _Reason:_ cleaner UX than a bare tag push; release notes are written in the GitHub UI before the workflow fires.

_Decision:_ Build `dist/` inside the workflow, never commit it — _Reason:_ `dist` is already gitignored; CI is the authoritative build environment.

_Decision:_ Enable `--provenance` on `npm publish` — _Reason:_ free supply-chain attestation, requires the same `id-token: write` permission already needed for OIDC.

_Decision:_ No GitHub Environment for now — _Reason:_ keep the setup minimal; an approval gate can be added later if needed.

_Decision:_ Name the workflow file `publish.yml` — _Reason:_ this value is registered verbatim in the npm Trusted Publisher settings; conventional and unambiguous.

_Decision:_ Run type-check + tests as steps in the same job before `npm publish` — _Reason:_ sequential steps in one job already block publish on failure; no separate job needed for a plugin this size.

_Decision:_ Do one manual `npm publish --access public` first, then configure npm Trusted Publishing — _Reason:_ the OIDC trusted publisher entry on npm requires the package to already exist; manual bootstrap is the correct first step.

### Bootstrap sequence (for reference)

1. `cd packages/plugin && npm publish --access public` (one-time, local)
2. On npmjs.com → package settings → Trusted Publishers → Add: `marcomuser / vite-plugin-webawesome / publish.yml`
3. Create `.github/workflows/publish.yml` in the repo
4. On next GitHub Release → workflow fires via OIDC, no token stored
