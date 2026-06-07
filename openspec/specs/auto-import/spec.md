## ADDED Requirements

### Requirement: Plugin transforms source files to inject component imports
The plugin SHALL scan each processed source file for `wa-*` custom element tags and prepend the corresponding side-effect import statements, ensuring components are registered before any render cycle executes.

#### Scenario: Single component detected
- **WHEN** a source file contains `<wa-button>`
- **THEN** the plugin prepends `import '@awesome.me/webawesome/dist/components/button/button.js'` to the file

#### Scenario: Multiple distinct components detected
- **WHEN** a source file contains both `<wa-button>` and `<wa-icon>`
- **THEN** the plugin prepends one import for each: `button.js` and `icon.js`

#### Scenario: Same component used multiple times
- **WHEN** `<wa-button>` appears three times in the same file
- **THEN** only one import for `button.js` is prepended (deduplication via `Set`)

#### Scenario: No wa-* tags present
- **WHEN** a source file contains no `wa-*` tags
- **THEN** the plugin returns `null` (no transformation applied)

### Requirement: Component tag-to-path mapping follows a predictable convention
The plugin SHALL map each `wa-<name>` tag to `@awesome.me/webawesome/dist/components/<name>/<name>.js`, where `<name>` is the portion of the tag after `wa-`.

#### Scenario: Standard component mapping
- **WHEN** the tag `wa-dialog` is detected
- **THEN** the resolved import path is `@awesome.me/webawesome/dist/components/dialog/dialog.js`

### Requirement: File extension allowlist restricts which files are transformed
The plugin SHALL only apply the transform to files with extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`. All other file types SHALL be skipped.

#### Scenario: JSX file is transformed
- **WHEN** Vite processes a `.tsx` file
- **THEN** the plugin scans it for `wa-*` tags

#### Scenario: CSS file is skipped
- **WHEN** Vite processes a `.css` file
- **THEN** the plugin returns `null` without scanning

#### Scenario: node_modules are skipped
- **WHEN** the file `id` contains `node_modules`
- **THEN** the plugin returns `null` without scanning

### Requirement: Tag detection strips comments before scanning
The plugin SHALL strip single-line comments (`//`), multi-line comments (`/* */`), JSX block comments (`{/* */}`), and HTML comments (`<!-- -->`) from the source before applying the tag-detection regex, to avoid injecting imports for commented-out components.

#### Scenario: Tag in single-line comment is ignored
- **WHEN** a file contains `// <wa-button>` and no other `wa-button` usage
- **THEN** no import for `button.js` is injected

#### Scenario: Tag in JSX comment is ignored
- **WHEN** a file contains `{/* <wa-icon name="x" /> */}` and no other `wa-icon` usage
- **THEN** no import for `icon.js` is injected

#### Scenario: Tag in multi-line comment is ignored
- **WHEN** a file contains `/* <wa-badge> */` and no other `wa-badge` usage
- **THEN** no import for `badge.js` is injected

#### Scenario: Tag in HTML comment is ignored
- **WHEN** a Vue template contains `<!-- <wa-button> -->` and no other `wa-button` usage
- **THEN** no import for `button.js` is injected

### Requirement: Source maps are preserved when imports are injected
The plugin SHALL use `magic-string` to prepend import statements so that a valid source map offset is returned with the transformed code, keeping debugger line numbers accurate.

#### Scenario: Transformed file returns a source map
- **WHEN** the plugin injects one or more imports into a file
- **THEN** the returned object includes both `code` and a non-null `map`

### Requirement: Plugin performs an early-exit optimisation
The plugin SHALL skip the full comment-strip-and-match pipeline if the source string contains no occurrence of the substring `wa-`, returning `null` immediately.

#### Scenario: File with no wa- substring is skipped cheaply
- **WHEN** a `.tsx` file contains no `wa-` substring
- **THEN** the plugin returns `null` without performing comment stripping or regex matching
