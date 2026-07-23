# ua-info Interactive Playground Design

**Status:** Approved for implementation planning  
**Date:** 2026-07-23  
**Repository:** `petechatchawan/ua-info`  
**Production URL:** `https://petechatchawan.github.io/ua-info/`

## 1. Purpose

Create a fast, privacy-preserving, framework-neutral playground that demonstrates the public `ua-info` package contract in a real browser.

The playground serves four purposes:

1. Let users inspect the current browser environment.
2. Let users parse a supplied User-Agent and optional Client Hints.
3. Explain the normalized `ua-info` result without conflating browser, mode, context, operating system, device, and non-browser client identities.
4. Act as a consumer-contract gate for package exports, declaration files, browser bundling, and GitHub Pages deployment.

The playground is not part of the npm runtime package and does not change `ua-info` library semantics.

## 2. Frozen Decisions

- The playground lives in the existing repository under `apps/playground`.
- It uses Vite, Vanilla TypeScript, native DOM APIs, and custom CSS.
- It has no frontend framework, component library, router, or state-management dependency.
- It imports only published public entry points:

```ts
import { parse } from 'ua-info';
import { detectCurrent } from 'ua-info/browser';
import { parseRequest } from 'ua-info/server';
```

- It must never import from `../../src`, a TypeScript path alias to source, or a private build path.
- The authoritative consumer check installs a tarball produced by `npm pack` before type-checking, testing, or building the playground.
- Production deployment is separate from npm publication.
- Pull requests verify the playground but do not deploy it.
- Production deploys from `master` through GitHub Actions Pages artifact deployment.
- All parsing and detection occur locally in the browser. No User-Agent or Client Hints data is transmitted.
- The first release is English-only.
- Manual parsing uses a 300 ms debounce and also supports immediate parsing through `Ctrl/Cmd + Enter`.
- Current-browser detection is the default mode.
- Advanced Client Hints input is optional and collapsed by default.

## 3. Repository Topology

```text
ua-info/
├── src/                              # canonical library source
├── apps/
│   └── playground/
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       ├── public/
│       │   └── favicon.svg
│       ├── src/
│       │   ├── main.ts
│       │   ├── app/
│       │   ├── components/
│       │   ├── services/
│       │   ├── samples/
│       │   ├── styles/
│       │   └── tests/
│       └── e2e/
├── scripts/
│   └── install-playground-package.mjs
├── package.json                      # canonical npm package
└── .github/workflows/
    ├── ci.yml
    ├── publish.yml
    └── deploy-playground.yml
```

The root package remains the only canonical npm package. The playground may have its own private `package.json` and lock file for isolated frontend tooling, but it must not be included in the root npm tarball.

## 4. Package Boundary and Build Contract

### 4.1 Required flow

```text
build ua-info
    ↓
npm pack
    ↓
install generated tarball into apps/playground
    ↓
type-check playground
    ↓
run unit, DOM, integration, and package-contract tests
    ↓
Vite production build
    ↓
Playwright production smoke
    ↓
deploy dist artifact
```

The tarball installation is mandatory. A workspace link or direct source mapping is insufficient because it would not verify:

- `package.json` exports
- ESM artifact paths
- browser and server subpaths
- generated declaration files
- npm `files` inclusion
- package identity as observed by an external consumer

### 4.2 Isolation guarantees

- Root `files` remains limited to `dist`, `README.md`, and `LICENSE`.
- Playground UI changes do not require a package version bump.
- npm publish and GitHub Pages deploy remain independent workflows.
- Playground runtime code does not become a library dependency.
- The library build does not depend on Vite, Vitest, jsdom, or Playwright.

## 5. Product Experience

The application is a single-page tool with this structure:

```text
Header
├── package identity and short description
├── package version
├── GitHub link
└── npm link

Mode selector
├── Current Browser
└── Manual User-Agent

Workspace
├── Input panel
└── Result panel
    ├── identity summary
    ├── detailed cards
    ├── raw JSON
    └── API example

Privacy notice
```

No routing is required.

## 6. Detection Modes

### 6.1 Current Browser

Current Browser is selected at application startup.

```ts
const result = await detectCurrent({
  highEntropy: [
    'architecture',
    'bitness',
    'fullVersionList',
    'model',
    'platformVersion',
  ],
});
```

The UI exposes these states:

- detecting
- success
- failure with retry

A failure must not prevent Manual User-Agent mode from working.

The panel includes an explicit privacy statement:

> Detection happens locally in your browser. No data is uploaded.

### 6.2 Manual User-Agent

Manual mode contains a labelled multiline textarea.

```ts
const result = parse(userAgent);
```

Behavior:

- Parse after 300 ms without additional input.
- Selecting a sample parses immediately.
- `Ctrl/Cmd + Enter` parses immediately and cancels any pending debounce.
- Reset clears User-Agent, selected sample, Client Hints, errors, and result.
- An empty User-Agent displays an empty state rather than a misleading profile.

### 6.3 Advanced Client Hints

Advanced Client Hints is implemented with native `<details>` and `<summary>`.

The editor accepts a JSON object representing HTTP headers. When valid and non-empty, parsing uses a dynamically imported server entry:

```ts
const { parseRequest } = await import('ua-info/server');
const result = parseRequest({ userAgent, headers });
```

When no Client Hints are supplied, the application uses `parse()` and must not load the server chunk.

Invalid Client Hints input:

- displays an inline error
- preserves the most recent valid result
- does not call `parseRequest()`
- never executes or interpolates input as HTML

## 7. Sample Corpus

Samples are readonly data, not component literals.

```ts
interface UserAgentSample {
  readonly id: string;
  readonly label: string;
  readonly category: SampleCategory;
  readonly userAgent: string;
  readonly clientHints?: Readonly<Record<string, string>>;
}
```

Required categories and baseline samples:

- Desktop browsers: Chrome, Edge, Firefox, Safari
- Mobile browsers: Chrome Android, Safari iPhone
- WebViews: Android WebView, iOS WKWebView
- Applications and mini-apps: LINE LIFF, LINE in-app, Facebook, Instagram, TikTok
- Automation and bots: Headless Chrome, Googlebot
- HTTP clients: curl
- Unknown or malformed input

LINE LIFF is a required regression sample because it demonstrates separate browser, mode, context, and host identities.

## 8. Result Presentation

### 8.1 Summary

The first result surface is a concise identity summary:

```text
Browser     Chrome 150
Mode        WebView
Context     LINE / LIFF
OS          Android 16
Device      Mobile
```

Browser, browser mode, context host, and context name remain separate fields.

### 8.2 Detail cards

Required cards:

- Browser
- Context
- Client
- Engine
- Operating System
- Device
- CPU

Cards show only defined fields. Missing values render as `Not detected`, never as an empty string, `undefined`, or a misleading default.

### 8.3 Raw JSON

Raw JSON is produced from the actual result:

```ts
JSON.stringify(result, null, 2)
```

It is assigned through `textContent` and has a Copy JSON action.

### 8.4 API example

The example changes with the active input mode:

- `detectCurrent()` for Current Browser
- `parse()` for Manual User-Agent
- `parseRequest()` for Manual User-Agent with Client Hints

The first release provides copyable static examples, not an executable code editor.

## 9. Application Architecture

### 9.1 Layers

```text
DOM event
    ↓
component callback
    ↓
application controller
    ↓
action
    ↓
pure reducer
    ↓
immutable state
    ↓
effect service for asynchronous work
    ↓
success or failure action
    ↓
view-model mapping
    ↓
component update
```

### 9.2 State

```ts
interface PlaygroundState {
  readonly mode: 'current' | 'manual';
  readonly current: CurrentDetectionState;
  readonly manual: {
    readonly userAgent: string;
    readonly selectedSampleId: string | null;
    readonly clientHints: {
      readonly expanded: boolean;
      readonly text: string;
      readonly error: ClientHintsInputError | null;
    };
    readonly parseStatus:
      | 'idle'
      | 'scheduled'
      | 'parsing'
      | 'success'
      | 'error';
    readonly result: UAResult | null;
    readonly errorMessage: string | null;
  };
  readonly notification: PlaygroundNotification | null;
}
```

The reducer is synchronous and pure. It must not access the DOM, timers, clipboard, `navigator`, or `ua-info` functions.

### 9.3 Store

```ts
interface PlaygroundStore {
  getState(): PlaygroundState;
  dispatch(action: PlaygroundAction): void;
  subscribe(listener: (state: PlaygroundState) => void): () => void;
}
```

The store owns only state transition and subscription notification.

### 9.4 Detection service

Public package access is centralized:

```ts
interface UADetectionService {
  detectCurrent(): Promise<UAResult>;
  parseUserAgent(userAgent: string): UAResult;
  parseRequest(input: {
    readonly userAgent: string;
    readonly headers: Readonly<Record<string, string | readonly string[]>>;
  }): Promise<UAResult>;
}
```

Components must not import `ua-info` directly.

## 10. Component Model

Components are DOM component objects:

```ts
interface Component<TModel> {
  readonly element: HTMLElement;
  update(model: TModel): void;
  destroy(): void;
}
```

Rules:

- Event listeners are registered once.
- Components receive callbacks at construction and view models through `update()`.
- Components do not access the store directly.
- Components do not invoke parser functions.
- Components do not mutate global state.
- `destroy()` removes owned listeners, subscriptions, and timers.
- The application shell is not replaced on every keystroke.
- Textarea selection, focus, native disclosure state, and JSON scroll position should remain stable during updates.

Required component areas:

- app header
- mode selector
- current-browser panel
- manual User-Agent panel
- sample selector
- Client Hints editor
- detection summary
- detail card collection
- JSON viewer
- API example
- status message
- privacy notice

## 11. View-Model Rules

Raw `UAResult` interpretation is centralized in pure mappers.

```ts
interface DetectionSummaryViewModel {
  readonly browser: string;
  readonly mode: string;
  readonly context: string;
  readonly os: string;
  readonly device: string;
}
```

Mappers must:

- use `version.raw` for display
- label browser modes consistently, such as `WebView`
- keep context host and context surface semantically distinct
- represent missing values as `Not detected`
- avoid changing the raw JSON representation

## 12. Styling

Styling uses custom CSS only:

```text
styles/
├── tokens.css
├── base.css
├── layout.css
├── components.css
└── utilities.css
```

Rules:

- CSS custom properties define spacing, typography, radii, semantic colors, focus, and motion durations.
- Component classes use the `ua-playground-` prefix.
- State is exposed through meaningful `data-*` attributes.
- Light and dark color schemes follow `prefers-color-scheme`.
- Reduced motion follows `prefers-reduced-motion`.
- No remote fonts, icon CDN, Tailwind, Sass, Bootstrap, or UI framework.
- Inline SVG may be used only when it improves clarity and must use `currentColor`.

Responsive layout:

- Desktop: input and result columns, approximately 40/60.
- Narrow screens: a single column in DOM order.
- The page must not horizontally overflow at 320 CSS pixels.
- JSON and code panels scroll internally.
- Interactive targets are at least 44 by 44 CSS pixels.

## 13. Accessibility

Required behavior:

- semantic buttons, labels, textarea, details, and summary
- keyboard-operable mode selection with selected state
- `aria-live="polite"` or equivalent status semantics for detection progress
- `role="alert"` for errors
- accessible names for icon-only actions
- no color-only status communication
- logical focus order
- usable at 200% zoom
- usable with reduced motion

Manual release verification includes keyboard-only navigation, screen-reader landmark order, light mode, dark mode, 200% zoom, and 320-pixel viewport inspection.

## 14. Privacy and Security

The first release includes no:

- analytics
- backend endpoint
- remote logging
- User-Agent submission
- Client Hints submission
- cookies
- persistent User-Agent history
- third-party embeds
- third-party runtime assets

User-controlled content is untrusted.

Required rendering rules:

```ts
element.textContent = value;
textarea.value = value;
```

Forbidden for user-controlled data:

```ts
element.innerHTML = value;
element.insertAdjacentHTML('beforeend', value);
```

Client Hints parsing must:

- limit input size
- require an object root
- accept only supported header value shapes
- reject `__proto__`, `prototype`, and `constructor` keys
- never evaluate code
- never persist input

Clipboard failures are non-fatal and produce a temporary status message.

## 15. Testing Strategy

### 15.1 Pure unit tests

Use Vitest for:

- reducer branches
- view-model mapping
- Client Hints validation
- debounce timing and cancellation
- sample selection
- reset behavior
- notification lifecycle

### 15.2 DOM component tests

Use Vitest with jsdom for observable behavior:

- keyboard and click callbacks
- labels and accessible states
- error and status semantics
- `Not detected` rendering
- raw JSON escaping
- copy callbacks
- native details/summary behavior
- listener cleanup

Large snapshots are not the primary assertion mechanism.

### 15.3 Application integration tests

Create the application with injected fake services and verify:

- startup current detection
- current detection success and failure
- manual parsing after debounce
- immediate keyboard parsing
- sample population
- Client Hints validation
- `parse()` versus `parseRequest()` selection
- reset and focus behavior
- clipboard failure handling
- app destruction cleanup

### 15.4 Public package contract tests

Contract tests import only:

```ts
import { parse } from 'ua-info';
import { detectCurrent } from 'ua-info/browser';
import { parseRequest } from 'ua-info/server';
```

They run after installing the generated package tarball and verify all three public entry points and their types.

### 15.5 Production browser smoke

Playwright runs against the built Vite output under the real base path `/ua-info/` and verifies:

1. CSS and JavaScript assets load.
2. No browser console error occurs.
3. Current Browser produces a result.
4. Manual mode works.
5. LINE LIFF displays browser, mode, context host, and context surface separately.
6. Raw JSON parses as valid JSON.
7. A 320-pixel viewport has no page-level horizontal overflow.
8. No request is made to a third-party origin.
9. Dynamic loading of the server entry works under the GitHub Pages base path.

On failure, CI uploads Playwright trace, screenshot, and relevant logs.

## 16. Tooling and Dependency Policy

Runtime dependency:

- `ua-info`, installed from the generated local tarball during verification

Development dependencies:

- Vite
- TypeScript
- Vitest
- jsdom
- Playwright

The implementation must select versions compatible with the repository's supported Node policy or isolate tooling that requires Node 22 to the Node 22 playground job without changing the root library engine requirement.

Do not add React, Vue, Angular, Lit, Tailwind, Sass, Redux, an icon package, a syntax-highlighting package, or an analytics SDK.

## 17. Commands

The root repository exposes these commands:

```text
npm run playground:dev
npm run playground:typecheck
npm run playground:test
npm run playground:build
npm run playground:test:e2e
npm run playground:check
```

Required semantics:

- `playground:dev`: build/package the library contract, install it for the playground, and start Vite.
- `playground:typecheck`: type-check the playground against the installed tarball.
- `playground:test`: run unit, DOM, integration, and public-contract tests.
- `playground:build`: produce the GitHub Pages build with base `/ua-info/`.
- `playground:test:e2e`: run the production build smoke.
- `playground:check`: execute the complete library-to-browser consumer gate.

The pack/install script must clean temporary artifacts on both success and failure.

## 18. CI and Deployment

### 18.1 CI

The existing root library matrix remains intact for Node 18, 20, and 22.

Add a separate Node 22 playground job:

```text
checkout
    ↓
install root dependencies
    ↓
install playground tooling dependencies
    ↓
build root package
    ↓
pack and install tarball into playground
    ↓
type-check
    ↓
unit, DOM, integration, and contract tests
    ↓
Vite build
    ↓
install Chromium
    ↓
Playwright production smoke
```

Pull requests verify but do not deploy.

### 18.2 Pages deployment

`deploy-playground.yml`:

- deploys from `master`
- uses GitHub Pages Actions artifact deployment
- runs the same package-consumer verification before upload
- deploys only the Vite `dist` output
- uses concurrency to avoid overlapping production deploys
- grants only the permissions required by Pages deployment

Path triggers include:

- `apps/playground/**`
- public library source and export configuration
- package build scripts relevant to public artifacts
- the playground install script
- `deploy-playground.yml`

The Vite base is `/ua-info/`.

A future custom domain may add a `CNAME` without moving playground source or changing the package boundary.

## 19. Documentation

Add `apps/playground/README.md` covering:

- purpose
- architecture boundary
- local commands
- tarball installation flow
- test layers
- GitHub Pages base path
- privacy guarantee
- adding samples
- adding components
- deployment workflow

Update the root README with:

- an Interactive Playground link
- `npm run playground:dev` in development instructions

The root README should not duplicate the full internal component architecture.

## 20. Explicit Non-Goals

The first release does not include:

- a code editor
- routing
- shareable encoded URLs
- a server-side parsing endpoint
- multi-UA comparison
- performance benchmarking
- contribution forms
- authentication
- analytics
- PWA installation
- a service worker
- offline mode
- internationalization
- stored parsing history
- user-selectable theme

## 21. Acceptance Criteria

### Package boundary

- Playground imports only public package specifiers.
- Verification installs an `npm pack` tarball.
- No source alias bypasses package exports.
- Playground files are absent from the root npm tarball.
- npm publish remains independent from Pages deployment.

### Product behavior

- Current Browser works on load and can be retried.
- Manual parsing is debounced by 300 ms.
- Immediate parse keyboard shortcut works.
- Required sample categories exist.
- Optional Client Hints use `parseRequest()` through dynamic import.
- Invalid Client Hints preserve the last valid result.
- Browser, mode, context, OS, device, client, engine, and CPU remain semantically distinct.
- Raw JSON reflects the actual `UAResult`.

### Architecture

- No frontend framework runtime exists.
- Components do not import `ua-info` directly.
- The reducer is pure.
- State updates do not replace the entire application shell.
- Owned listeners and timers are cleaned up.

### Security and privacy

- User input is never rendered through `innerHTML`.
- Dangerous Client Hints keys are rejected.
- No user input is persisted.
- No third-party network request occurs during production smoke.
- No analytics or backend is present.

### Accessibility and responsiveness

- Forms and actions have accessible names.
- Loading and errors use correct live-region semantics.
- Keyboard-only operation works.
- Light, dark, and reduced-motion preferences are supported.
- No page-level horizontal overflow occurs at 320 CSS pixels.

### Verification and deployment

- Root library checks remain passing.
- Playground type-check passes against the packed artifact.
- Unit, DOM, integration, and package-contract tests pass.
- Vite production build passes with base `/ua-info/`.
- Playwright smoke passes at `/ua-info/`.
- GitHub Pages deploys only after verification succeeds.

## 22. Implementation Sequencing

The implementation plan should split work into independently reviewable tasks in this order:

1. Package-consumer harness and tarball installation.
2. Playground skeleton and base-path production build.
3. Pure state, reducer, Client Hints validation, and debounce utilities through TDD.
4. Detection service and public-entry contract tests.
5. DOM component primitives and application shell.
6. Current Browser mode.
7. Manual User-Agent mode and sample corpus.
8. Advanced Client Hints dynamic import.
9. Result summary, cards, JSON, and API examples.
10. Responsive styling, accessibility, privacy, and security hardening.
11. Production Playwright smoke.
12. CI, Pages deployment, and documentation.

Each behavior task must follow red-green-refactor. Configuration-only tasks must still include an executable verification gate.