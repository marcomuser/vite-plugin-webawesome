## ADDED Requirements

### Requirement: SFC files inject imports inside the script block
For `.vue` and `.svelte` files the plugin SHALL inject side-effect import statements after the opening `<script` tag rather than prepending them to the file root, producing valid SFC syntax that the framework compiler can process.

#### Scenario: Vue SFC with script setup block
- **WHEN** a `.vue` file contains `<wa-button>` and has a `<script setup>` block
- **THEN** the import `import '…/button/button.js'` is inserted as the first line inside the `<script setup>` block

#### Scenario: Vue SFC with plain script block
- **WHEN** a `.vue` file contains `<wa-icon>` and has a `<script>` block (no `setup` attribute)
- **THEN** the import is inserted as the first line inside that `<script>` block

#### Scenario: Both script and script setup present
- **WHEN** a `.vue` file has both `<script>` and `<script setup>` blocks
- **THEN** the import is inserted into whichever `<script` tag appears first in the file

#### Scenario: SFC with no script block
- **WHEN** a `.vue` or `.svelte` file has no `<script>` block
- **THEN** the plugin prepends `<script>\n<imports>\n</script>\n` before the rest of the file

#### Scenario: Svelte SFC with script block
- **WHEN** a `.svelte` file contains `<wa-button>` and has a `<script>` block
- **THEN** the import is inserted as the first line inside the `<script>` block

### Requirement: SFC transforms do not set moduleType
The plugin SHALL NOT return `moduleType: 'js'` for `.vue` or `.svelte` files so that Vite routes the transformed SFC source to the correct framework compiler.

#### Scenario: Vue file transform result has no moduleType
- **WHEN** the plugin transforms a `.vue` file
- **THEN** the returned object contains `code` and `map` but `moduleType` is `undefined`

#### Scenario: Svelte file transform result has no moduleType
- **WHEN** the plugin transforms a `.svelte` file
- **THEN** the returned object contains `code` and `map` but `moduleType` is `undefined`
