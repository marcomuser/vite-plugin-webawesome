## ADDED Requirements

### Requirement: Plugin source contains no `any` casts
The plugin source (`packages/plugin/src/index.ts`) SHALL contain no `as any` type casts. All property accesses on Vite's `ResolvedConfig` and related types SHALL use the types as declared by the installed Vite package.

#### Scenario: `rolldownOptions` accessed without `any` cast
- **WHEN** the plugin's `configResolved` hook reads `config.build.rolldownOptions`
- **THEN** the access is typed via `ResolvedBuildOptions` without an `as any` cast

#### Scenario: Empty rolldown input list is handled with a type-narrowing guard
- **WHEN** `rolldownOptions.input` is a non-string value and `Object.values(input)` returns an empty array
- **THEN** the hook returns early without calling `resolve()` and without using an `as string` cast

### Requirement: Test files derive hook types from Vite's `HookHandler` utility
Both test files SHALL use `HookHandler<NonNullable<Plugin['configResolved']>>` and `HookHandler<NonNullable<Plugin['transform']>>` to type plugin hook invocations. Neither file SHALL declare a local `TransformResult` alias or use `config: any` as a parameter type.

#### Scenario: `callConfigResolved` uses typed config parameter
- **WHEN** `callConfigResolved` is called in `styles-injection.test.ts`
- **THEN** its `config` parameter is typed as `ResolvedConfig`, not `any`

#### Scenario: `plugin.transform` is cast via `HookHandler`
- **WHEN** either test file invokes `plugin.transform`
- **THEN** the cast uses `HookHandler<NonNullable<Plugin['transform']>>` rather than a manually-written function signature
