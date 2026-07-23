# UA Info Playground

The UA Info Playground is a private Vite application deployed at <https://petechatchawan.github.io/ua-info/>. It demonstrates the public `ua-info` package contract without shipping playground code in the npm package.

## Package boundary

The playground imports only `ua-info`, `ua-info/browser`, and the dynamically loaded `ua-info/server` entry. Verification builds the root library, creates an `npm pack` tarball, installs that tarball into this application, and then type-checks, tests, bundles, and browser-smokes the consumer. Source aliases and private dist paths are forbidden.

## Local setup

```bash
npm install
npm ci --prefix apps/playground
npm run playground:dev
```

Useful root commands:

```bash
npm run playground:install
npm run playground:boundaries
npm run playground:typecheck
npm run playground:test
npm run playground:build
npm run playground:test:e2e
npm run playground:check
```

## Source layers

- `src/app`: immutable state, reducers, effects, view models, and application composition.
- `src/components`: persistent DOM component objects.
- `src/services`: the public package adapter and browser-service boundaries.
- `src/samples`: readonly User-Agent examples.
- `src/styles`: custom CSS tokens, layout, components, and accessibility utilities.
- `e2e`: production-build smoke tests at the real `/ua-info/` base path.

## Adding a sample

Add a readonly `UserAgentSample` to the matching file under `src/samples`, give it a stable unique ID, and extend `samples.test.ts`. Client Hints are optional header-style JSON data.

## Adding a component

Implement `Component<TModel>`, create DOM nodes once, update through `textContent` and element properties, and clean owned listeners in `destroy()`. Components must not import `ua-info` or access the store directly.

## Test layers

Vitest covers reducers, utilities, services, view models, components, application integration, and the packed public entry points. Playwright verifies the production build, `/ua-info/` asset paths, LINE LIFF identity separation, 320px layout, console health, and absence of third-party requests.

## Privacy

All detection and parsing run locally. The application has no backend, analytics, remote logging, cookies, persisted User-Agent history, remote fonts, remote icons, or third-party embeds.

## Deployment

Pull requests verify but do not deploy. `deploy-playground.yml` deploys only `apps/playground/dist` after verification on `master` or manual dispatch. A future custom domain can add a `CNAME` without changing the source or package boundary.
