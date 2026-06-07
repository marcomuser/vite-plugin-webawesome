## ADDED Requirements

### Requirement: Workflow triggers on GitHub Release
The publish workflow SHALL be triggered exclusively when a GitHub Release is published (`release: types: [published]`).

#### Scenario: Release published triggers workflow
- **WHEN** a GitHub Release is published on the `marcomuser/vite-plugin-webawesome` repository
- **THEN** the publish workflow runs automatically

#### Scenario: Tag push alone does not trigger workflow
- **WHEN** a git tag is pushed without creating a GitHub Release
- **THEN** the publish workflow SHALL NOT run

### Requirement: Workflow builds the plugin before publishing
The workflow SHALL run `npm run build` inside `packages/plugin/` to produce `dist/` before any publish step.

#### Scenario: Build step produces dist artifacts
- **WHEN** the workflow starts
- **THEN** `npm install` and `npm run build` run inside `packages/plugin/` producing `dist/index.mjs` and type declaration files

### Requirement: Pre-publish checks block bad releases
The workflow SHALL run type-check and tests as steps before `npm publish`. A failure in either step SHALL prevent the publish step from running.

#### Scenario: Type-check failure blocks publish
- **WHEN** `tsc --noEmit` exits with a non-zero code
- **THEN** the workflow fails and `npm publish` is not executed

#### Scenario: Test failure blocks publish
- **WHEN** `node --test` exits with a non-zero code
- **THEN** the workflow fails and `npm publish` is not executed

#### Scenario: All checks pass, publish proceeds
- **WHEN** type-check and tests both pass
- **THEN** `npm publish` runs as the next step

### Requirement: Publish uses OIDC (no stored token)
The workflow SHALL use npm Trusted Publishing via OIDC. No `NPM_TOKEN` secret SHALL be required or stored in the repository.

#### Scenario: Workflow publishes without a stored secret
- **WHEN** the publish step runs
- **THEN** npm exchanges the GitHub OIDC token for a scoped publish token at runtime

### Requirement: Published package includes provenance
`npm publish` SHALL be invoked with `--provenance`, attaching a signed SLSA attestation to the published package.

#### Scenario: Provenance attestation attached
- **WHEN** a version is published
- **THEN** the npm package page shows a provenance badge linking to the GitHub Actions run and commit SHA
