## MODIFIED Requirements

### Requirement: Auto-import spec scenarios are covered by tests
The test suite SHALL maintain a test case for every scenario defined in `openspec/specs/auto-import/spec.md`. Behavioural details (tag detection, comment stripping, deduplication, source maps) are specified in that feature spec and SHALL NOT be duplicated here.

#### Scenario: Auto-import test file exercises all feature spec scenarios
- **WHEN** `npm test` is run in `packages/plugin/`
- **THEN** `tests/auto-import.test.ts` contains a passing test case for each scenario in `auto-import/spec.md`

### Requirement: Styles-injection spec scenarios are covered by tests
The test suite SHALL maintain a test case for every scenario defined in `openspec/specs/styles-injection/spec.md`. Behavioural details (CSS injection, entry resolution, HMR robustness) are specified in that feature spec and SHALL NOT be duplicated here.

#### Scenario: Styles-injection test file exercises all feature spec scenarios
- **WHEN** `npm test` is run in `packages/plugin/`
- **THEN** `tests/styles-injection.test.ts` contains a passing test case for each scenario in `styles-injection/spec.md`
