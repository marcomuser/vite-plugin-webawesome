## 1. Plugin Source (`index.ts`)

- [x] 1.1 Remove `(config.build as any)` and access `config.build.rolldownOptions?.input` directly
- [x] 1.2 Replace `(Object.values(rolldownInput)[0] as string)` with a type-narrowing guard: extract to `values`, guard on `values[0]`, then assign

## 2. Test File Cleanup (`auto-import.test.ts`)

- [x] 2.1 Import `HookHandler` and `Plugin` from `vite`
- [x] 2.2 Define `type TransformFn = HookHandler<NonNullable<Plugin['transform']>>` and use it in place of the manual cast
- [x] 2.3 Remove the local `TransformResult` alias

## 3. Test File Cleanup (`styles-injection.test.ts`)

- [x] 3.1 Import `HookHandler`, `Plugin`, and `ResolvedConfig` from `vite`
- [x] 3.2 Define `type ConfigResolvedFn = HookHandler<NonNullable<Plugin['configResolved']>>` and `type TransformFn = HookHandler<NonNullable<Plugin['transform']>>`
- [x] 3.3 Replace `config: any` and inner `as (config: any) => void` in `callConfigResolved` with the derived types; update call sites to use `as ResolvedConfig` on partial mock objects
- [x] 3.4 Replace the manual `plugin.transform` cast with `TransformFn`
- [x] 3.5 Remove the local `TransformResult` alias

## 4. Verification

- [x] 4.1 Run `npm -w packages/plugin run build` — confirm zero TypeScript errors
- [x] 4.2 Run the test suite — confirm all tests pass
