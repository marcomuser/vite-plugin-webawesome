### Requirement: Vue example app renders wa-* components via plugin injection
The `packages/example-vue` workspace package SHALL start a Vite dev server that renders Web Awesome components (`wa-button`, `wa-badge`, `wa-icon`) without any manual import statements in the source files. All imports SHALL be injected by `vite-plugin-webawesome`.

#### Scenario: wa-button and wa-badge appear in the DOM
- **WHEN** the Vue example dev server is running and a browser navigates to `http://localhost:5174`
- **THEN** at least one `<wa-button>` element and one `<wa-badge>` element are present in the DOM

#### Scenario: wa-* elements are upgraded custom elements
- **WHEN** the page has loaded and custom element registration has completed
- **THEN** `wa-button`, `wa-badge`, and `wa-icon` elements SHALL have a shadow root (i.e., are properly upgraded, not left as unknown HTML elements)

### Requirement: Template-only SFC renders wa-icon via injected script block
The `IconRow.vue` component SHALL contain no `<script>` block in source. The plugin SHALL inject a full `<script>` wrapper with the `wa-icon` import so that `@vitejs/plugin-vue` can process the file.

#### Scenario: wa-icon elements are present in the DOM
- **WHEN** the Vue example page has loaded
- **THEN** at least one `<wa-icon>` element SHALL be present in the DOM, confirming the template-only SFC was processed correctly
