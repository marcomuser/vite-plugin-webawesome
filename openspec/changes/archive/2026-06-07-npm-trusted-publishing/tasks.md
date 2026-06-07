## 1. Bootstrap — first manual publish

- [x] 1.1 Run `cd packages/plugin && npm publish --access public` to create the package on npm for the first time
- [x] 1.2 Verify the package appears at `npmjs.com/package/vite-plugin-webawesome`

## 2. Configure npm Trusted Publishing

- [x] 2.1 On npmjs.com, open the `vite-plugin-webawesome` package → Settings → Trusted Publishers
- [x] 2.2 Add a trusted publisher entry: GitHub user `marcomuser`, repository `vite-plugin-webawesome`, workflow `publish.yml`, no environment

## 3. GitHub Actions workflow

- [x] 3.1 Create `.github/workflows/publish.yml` triggered on `release: types: [published]`
- [x] 3.2 Add `permissions: id-token: write, contents: read` to the job
- [x] 3.3 Add checkout step (`actions/checkout@v4`) and Node setup step (`actions/setup-node@v4` with `registry-url: https://registry.npmjs.org`)
- [x] 3.4 Add `npm ci` install step at the repo root
- [x] 3.5 Add build step: `npm run build` with `working-directory: packages/plugin`
- [x] 3.6 Add type-check step: `npx tsc --noEmit` with `working-directory: packages/plugin`
- [x] 3.7 Add test step: `npm test` with `working-directory: packages/plugin`
- [x] 3.8 Add publish step: `npm publish --provenance --access public` with `working-directory: packages/plugin`

## 4. Verify workflow end-to-end

- [x] 4.1 Bump version in `packages/plugin/package.json`, commit, and push
- [x] 4.2 Create a GitHub Release targeting the new commit — confirm the workflow triggers and completes successfully
- [x] 4.3 Verify the published version on npmjs.com shows the provenance badge
