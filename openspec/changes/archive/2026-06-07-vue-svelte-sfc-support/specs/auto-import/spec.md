## MODIFIED Requirements

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
