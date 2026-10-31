# user-agent-parser-ts v4: catalog architecture

Status: accepted design, implementation not started. Date: 2026-10-30.

This document is the contract for the v4 rework. Implementation PRs follow the sequence at the end. A PR that has to deviate from this design records the deviation under "Implementation reconciliation" in the same PR.

## Problem

`user-agent-parser-ts@3.0.0` is about 1,240 lines. Detection knowledge sits in three storage styles: regex tables, `if` chains, and `switch` statements. Precedence is first-match order, and nobody wrote that order down. Adding one browser means editing six to eight places. Nothing checks that the edits are complete, and the lists have already drifted.

A multi-model review (2026-10-30) verified 22 defects:

- Two regexes are super-linear. One takes 2.3 s on a 13 KB header, so a single request blocks the event loop.
- Detection is wrong for the reduced Chrome UA (`model: 'K'`). It is also wrong for Android TV, catch-all vendor prefixes, unlisted Chromium forks, and the generic bot fallback.
- Client Hints can overwrite more specific UA facts.
- The test suite cannot see data changes. The only detection gate is line coverage.

Most future work will be "add browser X, bot Y, vendor Z, in-app browser W". The contributor is often an agent that opens one file, copies the nearest row, and takes the shortest path that compiles. The design has to make that shortest path correct.

Constraints carried over from the v3 design (`2026-09-09-ua-info-v3-simple-api-design.md`):

- `parse()` is synchronous, deterministic, and does not read globals.
- `UAInfo` is plain and serializable, with a fixed shape. Unknown values are `null`.
- Predicates derive from `UAInfo` and never detect anything.
- Adapters enrich the same model.
- Field-level merge, where specific evidence beats generic evidence.
- Zero runtime dependencies. ESM and CJS output. Tree-shakeable subpaths.
- No public registry, plugin API, or stateful parser.
- The detector catalog is internal data.

Constraints from the toolchain:

- TypeScript 4.9.5 emits the `.d.ts` files. `satisfies` works. TS 5-only syntax is not allowed in emitted types.
- The runtime supports Node 18 or later. CI runs Node 18, 20, and 22.

## Usage (caller's view)

```ts
import { parse } from 'user-agent-parser-ts';
import { is, isBot } from 'user-agent-parser-ts/check';

const info = parse(request.headers['user-agent']);   // string | null | undefined; never throws

if (is(info, { browser: 'chrome', os: ['android', 'harmonyos'], device: 'mobile' })) {
  info.browser.name;   // narrowed to 'chrome'
  info.os.name;        // narrowed to 'android' | 'harmonyos'
}

if (isBot(info)) return new Response(null, { status: 403 });
if (is(info, { app: 'line' })) showOpenInBrowserHint();   // LINE in-app browser or LIFF

info.device;  // { type: 'mobile', vendor: 'samsung', model: 'SM-S928B' }
info.client;  // { type: 'ai-crawler', name: 'gptbot', token: 'GPTBot', version: { full: '1.2', major: 1 } }
```

```ts
import { parseRequest } from 'user-agent-parser-ts/server';
const info = parseRequest(request);          // Request, Headers, or a header record; UA + Sec-CH-UA-* in one pass

import { detect } from 'user-agent-parser-ts/browser';
const info = await detect({ highEntropy: true, liff });   // throws outside a window or worker (Node 21+ included)
```

The compiler enforces the following:

```ts
is(info, { browser: 'chrom' });           // error: did you mean 'chrome'?
is(info, { browser: 'android' });         // error: 'android' is an OSId, not a BrowserId
info.device.vendor === 'Samsung';         // error: vendor IDs are lowercase ('samsung')
```

The contributor workflow for the dominant task, "add a browser", is shown below. Each step is gated by the compiler or by tests.

```ts
// src/catalog/browsers.ts: one row; the key is the stable ID
whale: { family: 'chromium', engine: 'blink', brands: [], match: ['Whale'] },
```

```bash
npm run corpus:add -- --src "doc:https://…" "Mozilla/5.0 (…) Chrome/130.0.0.0 Whale/4.0.0.0 Safari/537.36"
npm test   # row must be proven by a corpus entry, must win it unambiguously, and must survive the shuffle and adversarial tests
```

The ID union, the `is()` query type, the Client Hints brand map, and the catalog docs all derive from that row. The `labels` record for `./labels` is a `Record<BrowserId, string>`, so `tsc` fails until the new ID has a label.

## Shape

### Data structures

**1. Scan (`src/core/scan.ts`).** This is the only code that reads UA characters. It makes one char-code pass and uses no RegExp.

```ts
export const MAX_UA_LENGTH = 1024;   // matching window; info.ua still echoes the full input
interface Product { readonly name: string; readonly raw: string; readonly version: string | null; readonly spaced: string | null; readonly top: boolean }
interface Part { readonly text: string; readonly lower: string; readonly group: number }
interface Scan {
  readonly products: readonly Product[];   // Name/Version tokens, top level or inside a comment; bare top-level words
  readonly parts: readonly Part[];         // ';'-separated segments of every ( ) and [ ] group
}
export function scan(input: string): Scan;
export function readVersion(raw: string | null): Version | null;   // the one version grammar: digits, '.' and '_'
```

The scanner caps output at 64 products and 64 parts. It skips URL words (`+http…`, anything containing `:` before `/`), so `mybot.html` can never become a product.

**2. Catalog rows (`src/catalog/*.ts`).** These files hold data only. There is one object per dimension, keyed by stable ID, and ID unions are `keyof typeof`. Rows cannot hold a RegExp. ESLint bans regex literals and `RegExp` in `src/**` with the message "Use catalog signals; RegExp is banned so parsing stays linear".

```ts
type Signal = string | { readonly part: string };   // 'SamsungBrowser' = product token; { part: 'Android' } = comment part head
interface Match<O extends string> {
  readonly product?: string; readonly part?: string;  // exactly one (union-enforced)
  readonly with?: readonly Signal[];                   // all must also be present
  readonly os?: readonly O[];                          // counts only when the resolved OS is one of these
  readonly versionFrom?: Signal;                       // read the version from another token (Safari: 'Version')
  readonly fallback?: true;                            // generic evidence: loses to every specific candidate
}
interface RowSpec<K extends string, O extends string, X = {}> {
  readonly match: readonly (string | (Match<O> & X))[];
  readonly beats?: readonly K[];                       // explicit precedence, transitive, acyclic (tested)
}
```

Example rows. A per-signal override is the only escape, and it is typed.

```ts
export const BROWSERS = defineBrowsers({
  chrome: { family: 'chromium', engine: 'blink', brands: [{ brand: 'Google Chrome', fallback: true }],
            match: [{ product: 'Chrome', fallback: true }, 'CriOS', { product: 'HeadlessChrome', mode: 'headless' }] },
  'samsung-internet': { family: 'chromium', engine: 'blink', brands: ['Samsung Internet'], match: ['SamsungBrowser'] },
  edge: { family: 'chromium', engine: 'blink', brands: ['Microsoft Edge'],
          match: ['Edg', 'EdgA', 'EdgiOS', { product: 'Edge', family: null, engine: null }] },   // Edge/ = EdgeHTML
  safari: { family: 'safari', engine: 'webkit', brands: [],
            match: [{ product: 'Safari', with: ['Version'], versionFrom: 'Version', os: ['ios', 'ipados', 'macos'], fallback: true }] },
});
export const OPERATING_SYSTEMS = defineOS({
  android: { match: [{ part: 'Android' }], platforms: ['Android'] },
  harmonyos: { match: [{ part: 'HarmonyOS' }, { part: 'OpenHarmony' }], platforms: ['HarmonyOS'], beats: ['android'] },
  windows: { match: [{ part: 'Windows NT' }], platforms: ['Windows'],
             scale: { ua: { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7' }, hint: windowsFromPlatformVersion } },
  ios: { match: [{ part: 'CPU iPhone OS' }, { part: 'iPhone OS' }], platforms: ['iOS'], engine: 'webkit' },
});
export const VENDORS = defineVendors({
  samsung: { words: ['SAMSUNG'], models: ['SM-', 'GT-', 'SCH-', 'SGH-'] },
  amazon: { words: ['Amazon'], models: [{ prefix: 'AFT', type: 'smart-tv' }, { prefix: 'KF', type: 'tablet' }] },
});
export const CLIENTS = defineClients({
  gptbot: { type: 'ai-crawler', match: ['GPTBot'] },
  'chatgpt-user': { type: 'ai-assistant', match: ['ChatGPT-User'] },
});
export const CLIENT_TYPES = {
  crawler: { bot: true }, 'ai-crawler': { bot: true }, bot: { bot: true }, 'ai-assistant': { bot: false }, /* … */
} as const satisfies Record<string, { readonly bot: boolean }>;
```

Every row must declare its Client Hints mapping. `brands` and `platforms` are required, and `[]` means "no known value". This closes the drift where only 4 of 14 browsers mapped. `defineX` uses a `NoInfer` tuple trick so that `beats` and `os` are checked against the same catalog's keys. A typo there is TS2820 "Did you mean".

**3. Candidates and `pick()` (`src/core/match.ts`).** This is the only precedence rule, and it applies to every dimension and every source.

```ts
type Source = 'ua' | 'hints' | 'runtime';                     // strength: runtime > hints > ua
interface Candidate<K extends string> { readonly id: K; readonly source: Source; readonly version: Version | null; readonly fallback: boolean }
function pick<K extends string>(candidates: readonly Candidate<K>[], beats: (a: K, b: K) => boolean): { winner: K | null; version: Version | null; survivors: readonly K[] };
```

`pick()` applies these steps in order:

1. The pool is the specific (non-fallback) candidates. When there are none, the pool is the fallback candidates.
2. Drop every candidate that another pool candidate beats, transitively.
3. If one ID is left, it wins.
4. If several IDs from different sources are left, keep the strongest source's candidates. If one ID is left, it wins.
5. If several IDs are still left, the result is ambiguous: the winner is `null` and the survivors are returned. Callers keep only the facts the survivors agree on, for example `family`.
6. The version comes from the strongest-source candidate of the winning ID that has a version.

Row order is never read. A shuffle test permutes every catalog and requires identical corpus output.

**4. One pipeline (`src/core/resolve.ts`).** `parse`, `parseRequest`, and `detect` all end in `resolve(ua, hints, runtime)`, so no second merger exists. `enrich.ts` and the "parse then patch" pattern are removed.

```ts
export interface Hints { brands; mobile; platform; platformVersion; architecture; bitness; model }   // domain type, internal
export interface Runtime { readonly standalone: boolean | null; readonly liff: boolean | null; readonly brave: boolean | null }
export function resolve(ua: string, hints: Hints | null, runtime: Runtime | null): UAInfo;
```

`resolve()` runs these steps in order:

1. `s = scan(ua)`
2. `os = pick(UA rows ∪ hint platform)`. Versions are scaled by the winning row.
3. `device`: type comes from `pick(type rows ∪ model-rule types ∪ hint mobile)`. The model is the hint model, or the UA model when there is none. The vendor follows the model.
4. `browser = pick(UA rows ∪ hint brands ∪ runtime brave)`, then the accounted-token rule.
5. `engine` is the first that applies: the OS engine (iOS or iPadOS gives WebKit), then the signal override, then the browser row engine, then tokens.
6. `cpu`, `client`, and `context` come from `pick()` over UA rows, hints, and runtime. The generic bot is a fallback candidate.
7. `mode` is the only cross-dimension rule. It is `headless` for a headless signal, then `webview` when `CONTEXT_TYPES[type].webview` is set, then `webview` for a `wv` part on a Chromium-family browser, then `browser` when a browser is known.

These merge rules follow from `pick()` without special cases (fixes #12-#14 and #19):

- **HarmonyOS UA with the hint `Android`.** `harmonyos` beats `android`, so `harmonyos` keeps its UA version.
- **UA `chrome` (fallback) with the hint `Brave`.** The hint is specific, so the result is `brave`.
- **UA `samsung-internet` with the hint `Google Chrome`.** That hint is a fallback candidate, so `samsung-internet` stays. The hint `Chromium` only contributes `family`.
- **Hint `mobile: true`.** It is a fallback type candidate from hints. It beats fallback UA types, such as `desktop` from `X11` (an Android desktop-site request) or `tablet` from Android without `Mobile`. It never beats a specific type such as `iPad`, a TV marker, or a model rule. `mobile: false` emits nothing.
- **Hardware is one unit.** When the hint model differs from the UA model, the vendor comes only from the hint model's vendor rules. No vendor is carried over from another model.
- **Windows versions use one marketing scale.** The NT map and the hint `platformVersion` map both go through `scale`. `Version.full` is never `'Vista'` or `'XP'`; those versions are `null`.

**5. Model extraction.** The model is the first unclaimed part after the OS part, in the same group. A part is claimed when it hits an OS, CPU, or device row, a noise word (`wv`, `mobile`, `tablet`, `u`, `rv:*`, `hmscore`), or a locale shape. A model needs 2 to 48 characters, so the reduced-UA `K` is rejected. Text is cut at ` Build/`. A leading vendor word such as `SAMSUNG SM-G960F` is stripped and becomes vendor evidence. Vendor rules match on the longest literal prefix, and each prefix needs at least 2 literal characters. Catch-alls like `P[A-Z]{2}…` cannot be written.

**6. The accounted-token rule.** A fallback browser winner (`chrome`, `safari`) drops to `name: null`, with `family` kept, when the UA has a top-level product token that neither a catalog row in any dimension nor `NEUTRAL_TOKENS` accounts for. `NEUTRAL_TOKENS` is `Mozilla`, `AppleWebKit`, `Gecko`, `Safari`, `Mobile`, `Version`, and similar. As a result, unlisted forks and app WebViews stop reporting `chrome`. The corpus measures the false-null rate before 4.0.0 ships (open question 1).

### Public result types (`src/types.ts`)

```ts
interface Version { readonly full: string; readonly major: number }              // full is always dotted digits
interface BrowserInfo { name: BrowserId | null; version: Version | null; family: BrowserFamily | null; mode: BrowserMode | null }
interface EngineInfo  { name: EngineId | null; version: Version | null }
interface OSInfo      { name: OSId | null; version: Version | null }
interface DeviceInfo  { type: DeviceType | null; vendor: VendorId | null; model: string | null }   // model: raw string, never invented
interface CPUInfo     { architecture: CPUArchitecture | null; bitness: 32 | 64 | null }
interface ClientInfo  { type: ClientType | null; name: ClientId | null; token: string | null; version: Version | null }
interface ContextInfo { type: ContextType | null; name: ContextId | null; app: AppId | null; version: Version | null }
interface UAInfo { ua: string; browser; engine; os; device; cpu; client; context }   // all readonly, fixed shape
```

Every ID union derives from the catalog keys.

- `client.token` is the product token as written (`GPTBot`). It is set for every matched client. For an unlisted generic bot, the result is `name: null, type: 'bot'` with its token.
- `context.app` names the native host: `line` for both the LINE in-app browser and LIFF. `context.version` is the host app version. Together they replace `host: ProductInfo`.

### Public exports

| Subpath | Exports |
| --- | --- |
| `.` | `parse`; types `UAInfo`, `*Info`, `Version`, every ID union, `BrowserFamily`, `BrowserMode`, `DeviceType`, `ClientType`, `ContextType` |
| `./check` | `is`, `isBot`; type `Query` |
| `./server` | `parseRequest`; types `ParseRequestInput`, `RequestLikeInput`, `HeaderSource`, `HeaderRecord`, `HeaderGetter`, `HeaderValue` |
| `./browser` | `detect`; types `DetectOptions`, `LiffAdapter` |
| `./labels` | `labels`: per-dimension `Record<Id, string>` display names (last PR; not part of the root bundle) |

`is(info, query)` takes these keys: `browser`, `family`, `mode`, `engine`, `os`, `device`, `vendor`, `client`, `clientType`, `context`, `contextType`, `app`. Each value is an ID or an array of IDs. Keys combine with AND, and array members combine with OR. The return type narrows every field the query touches. `isBot` is derived from `CLIENT_TYPES[type].bot`.

### Module map

```
src/index.ts        parse + public types                     ./ (root)
src/check.ts        is, isBot                                ./check
src/server.ts       parseRequest, header reading             ./server
src/browser.ts      detect, navigator/UAData/LIFF/display-mode (every probe guarded)   ./browser
src/labels.ts       labels                                   ./labels
src/types.ts        public result types (type-only imports from catalog)
src/core/scan.ts    scan, readVersion
src/core/match.ts   compile catalogs to Map indexes, find candidates, beats closure, pick
src/core/resolve.ts resolve and the per-dimension resolvers, deriveEngine, deriveMode, model extraction
src/core/hints.ts   Hints and Runtime, Sec-CH-UA structured-field reader (no RegExp), UAData normalization, GREASE
src/catalog/        define.ts browsers.ts os.ts devices.ts vendors.ts cpu.ts clients.ts contexts.ts
test/               corpus/*.jsonl, *.test.ts, types/*.ts   (outside src, so the build needs no exclude list)
```

A trace of any field reads three files: the entry point, `resolve.ts`, and the catalog row. The `exports` map makes `core/` and `catalog/` unreachable from outside. Inside the repo, ESLint `no-restricted-imports` stops catalog files from importing `core/`.

### What derives from the catalog, and what fails when it drifts

| Artifact | Derived how | Drift fails at |
| --- | --- | --- |
| ID unions | `keyof typeof CATALOG` | cannot drift |
| `beats`, `os`, `type`, `family`, `engine`, `app` references | typed against key unions | `tsc` |
| CH brand, platform, arch maps | built at load from required row fields | `catalog.test.ts` (strings unique across rows) |
| `is()` query type, `isBot` | type-level from unions; `CLIENT_TYPES` flags | `tsc` |
| `labels` | `satisfies Record<Id, string>` | `tsc` |
| README catalog tables | `npm run docs:catalog` writes generated regions | `docs:catalog --check` in CI |
| Row proof | every row must be the winner of at least one corpus entry, with no ambiguous pick | `catalog.test.ts`, which names the row and suggests `corpus:add` |

## Synthesis decision

Four runners on different models produced candidates: A (opus, declarative typed catalog), B (fable, tokenize once), C (sonnet, evidence resolution), and D (haiku, minimal evolution). A cross-judge (fable) scored them B 26, C 24, A 23, D 16 and recommended B as the base. The lead reviewer preferred A for its precedence model. A, B, and C converged on the same core without coordination: regex-free data rows, one linear scan with Map lookup, catalog-derived ID unions, one merge pipeline, lowercase vendor IDs, a closed `client.name`, a budget file, a corpus with provenance, and 4.0.0. That convergence is the main reason to trust the shape.

- **Base: B.** It has the only end-to-end prototype: 39 UAs diffed against v3, flat per-parse cost from 70 to 2,400 rows (2.45 to 2.50 µs), the 13 KB hostile input dropping from 2,270 ms to 0.06 ms, and a measured bundle cost. The design takes B's scanner (products plus parts), model extraction, `knownBug` ratchet, and per-PR deletion of old files.
- **From A:** `pick()` with `fallback` and `beats` replaces B's tier-plus-position tie-break, so no precedence depends on position. Also from A: the `defineX` key-derived unions with `NoInfer`, one regression test per verified defect, the 3.0.1 hotfix before any tooling change, and per-row proof as "wins its corpus entry unambiguously".
- **From C:** `is(info, query)` plus `isBot` replaces both named predicates and B's six generic predicates. From C's merge model: all sources feed one pipeline, a hint `mobile` acts as a constraint-style fallback, and versions are normalized at the row's `scale`. It is expressed through A's lighter `pick()` rather than C's claim buckets, which have unmeasured allocation cost.
- **From D:** the root fixes for the 3.0.1 hotfix on the old engine, and two new defects found by probe. Opera Mini reports a tablet with no OS. A loose LINE match yields `webview` with no browser.
- **Rejected:**
  - A's generated named predicates: the API grows with every row, and it needs a codegen step.
  - B's `labelOf(kind, id!)`: replaced by a `labels` record.
  - C's per-slot claim buckets: `pick()` covers the same laws with less machinery.
  - D's regex rows: cost stays O(rows), and ordering stays implicit.
  - The cross-judge's recommendation that `detect()` should trust `navigator.userAgent`. On Node 21+ that returns a server result from a browser API. Throwing outside a window or worker keeps the documented contract and surfaces SSR misuse on every Node version.

## Tradeoffs accepted

- We accept a signal vocabulary weaker than regex in exchange for linear time and a Map index by construction. Signals that cannot be expressed go into `resolve.ts` code, under review.
- We accept `null` for a same-source conflict between two specific candidates (rule 7 of the v3 contract) in exchange for never reading row order.
- We accept the accounted-token rule's false nulls, such as an OEM Chrome build that appends an unknown token. In exchange, unlisted forks never claim to be Chrome. The corpus measures the rate.
- We accept removing 45 named predicates and the five ID const objects in exchange for one narrowing `is()`. Every consumer edits each call site once, and `MIGRATION.md` gives the table.
- We accept that matching reads only the first 1,024 characters, in exchange for bounded cost. `info.ua` still holds the full input.
- We accept merge code in the root `parse` bundle (one pipeline), estimated at about 1 KB. In exchange, there is no second merger.
- We accept that a UA-only Windows 11 reports `'10'`. The UA cannot tell them apart. `parseRequest` with the platform-version hint can.

## Alternatives considered

- **Regex rows with a ReDoS linter and numeric priorities (D).** This is the smallest diff. However, per-request cost stays O(rows): measured at +15 µs at +400 rows. Linters are heuristic, and copied priorities collide. Contributors still see regexes and still write catch-alls.
- **One compiled alternation or Aho-Corasick over the raw string.** These are linear, but they ignore UA structure: product versus comment, name and version pairing, model segments. Boundary checks would turn it back into a tokenizer.
- **A JSON or YAML catalog with full code generation.** It loses in-editor type errors and adds a build step before every test.
- **Named predicates generated from the catalog (A).** They keep the v3 style, but the surface grows per row and they are a second way to write `is()`.
- **Per-field provenance on the public result (C).** Useful for debugging, but it bloats the serialized model. It stays internal, and the catalog tests use it.

## Breaking changes (4.0.0)

| Change | Migration |
| --- | --- |
| `BrowserId`, `EngineId`, `OSId`, `ContextId`, `CPUArchitecture` value objects removed (types stay) | `BrowserId.Chrome` becomes `'chrome'` |
| 45 named predicates and 8 generic predicates replaced by `is()` and `isBot()` | `isChrome(i)` becomes `is(i, { browser: 'chrome' })`; `isMobile(i)` becomes `is(i, { device: 'mobile' })`; `isWebView(i)` becomes `is(i, { mode: 'webview' })`; `isLine(i)` becomes `is(i, { app: 'line' })`; full table in `MIGRATION.md` |
| `device.vendor` changes from a display string to a lowercase `VendorId` | `'Samsung'` becomes `'samsung'`; display text comes from `labels.vendor.samsung` |
| `client.name` changes from an open string to `ClientId \| null`, and `client.token` is added; the three AI assistants get their own IDs | `name === 'ai-assistant'` becomes `type === 'ai-assistant'` |
| `context.host` and `ProductInfo` replaced by `context.app` and `context.version` | `host?.name` becomes `app`; `host?.version` becomes `version` |
| `Version.major` is always a number; `full` is always dotted digits | drop `major` null checks; invalid versions are `null` |
| `parseVersion` and `readHeader` are no longer exported | read `info.<dimension>.version` |
| `parse()` accepts `null` and `undefined` | none |
| `detect()` throws outside a window or worker, Node 21+ included | call `parse()` or `parseRequest()` on servers |
| Deep `dist/*/v3/*` paths change to `dist/*/*` | none for subpath imports |
| Detection fixes for #5 to #11 | listed in `MIGRATION.md` from the corpus diff |

## Test architecture (vitest)

The test stack is `vitest@~3.2` with `@vitest/coverage-v8@~3.2`, which runs on Node 18, 20, and 22. `vite` is pinned to `^6`, because Vite 7 needs Node 20.19 or later. Type tests run with plain `tsc` on 4.9.5, not vitest typecheck mode.

| File | Proves |
| --- | --- |
| `test/corpus/*.jsonl` + `corpus.test.ts` | Real UAs with required `src` (`doc:<url>`, `observed:<where>@<date>`, or `synthetic:<why>`), optional raw `headers` and `runtime`, and the full expected `UAInfo`. `knownBug: "#N"` runs the entry under `it.fails`, so the PR that fixes it must remove the tag. `corpus:add` and `corpus:update` write the expectations, and the PR diff shows every changed dimension. |
| `catalog.test.ts` | Every row wins at least one corpus entry with no ambiguous pick. `beats` is acyclic. Brand, platform, and model-prefix strings are unique, and prefixes have at least 2 characters. Shuffled catalogs give identical corpus output. A report lists rows that only synthetic entries prove. |
| `regressions.test.ts` | One named test per verified defect, #1 to #22 plus D's two findings. A snapshot update cannot re-accept a fixed bug. |
| `adversarial.test.ts` | Non-string input, 16 KB input, unbalanced brackets, and floods of every catalog key and every Sec-CH-UA header. Each case has a time ceiling, and the 16 KB to 4 KB ratio must stay under 6. |
| `scaling.test.ts` | The real catalog plus 2,000 synthetic rows: the lookup count is unchanged and the parse-time ratio stays under 1.5. |
| `resolve.test.ts` | Merge laws: hints-free `resolve` equals `parse`; runtime evidence changes only context, mode, and browser (Brave); a version never outlives its identity; vendor agrees with the model. |
| `test/types/*.ts` | `@ts-expect-error` typos, `is()` narrowing, and an exhaustive `switch` over `BrowserId`. |
| `test/contract/*.test.ts` | Server input shapes, `detect()` with `vi.stubGlobal`, and the packed consumer fixtures. |

## Release gates

- **`benchmarks/budget.json`** replaces the 2.2.0 baseline and the fixed 64-file and 150,000-byte ceilings. It holds per-scenario bundle raw and gzip bytes and the package unpacked bytes. The gate fails when a value is over budget, and also when a value is more than 10% under budget ("budget stale: run `npm run budget:update`"). Every increase is a one-line diff the PR has to justify. The CI summary prints the delta against budget and against `master`. Throughput stays advisory.
- **`verify-package.mjs`** reads the major version and the subpaths from `package.json`. It derives the allowed file set from the build output, plus README, MIGRATION, and LICENSE. It fails on any test, example, or corpus file. There is no file-count ceiling, because file count measures build layout, not download size.
- **The adversarial time ceilings** are blocking tests.

## PR sequence

Each PR keeps `npm run check` and CI green on Node 18, 20, and 22. A version bump publishes on merge (`publish.yml`), so only PR 1 and the final PR bump the version.

| # | PR | Version | Proves |
| --- | --- | --- | --- |
| 0 | `docs: v4 catalog architecture design` (this document) | — | Reviewable plan |
| 1 | `fix: bound UA input and remove super-linear regexes`, on the old engine and jest: `typeof` guard, 1,024 window, delete the `Tizen.+Mobile.+Watch` alternative, linear generic-bot regex, `\bLine\/` boundary, `detect()` environment check, guarded `matchMedia` | 3.0.1 | Timing tests fail before the fix and pass after. This is also the first OIDC publish through Trusted Publishing. |
| 2 | `chore: migrate tests from jest to vitest` | — | Same test count green on Node 18, 20, and 22; jest removed |
| 3 | `chore: replace fixed release ceilings with a reviewed budget` | — | Gate green at today's numbers and red on an injected +10% |
| 4 | `test: real-UA corpus with provenance and regression tests` | — | The current engine passes the non-bug entries; `knownBug` entries fail as tagged |
| 5 | `refactor: scanner, catalog and resolve pipeline (browsers, engines, contexts)` | — | Corpus green; #9, #11, #15 (brands), and #19 tags removed. Abort check: if browser rows need escape hatches, stop and redesign. |
| 6 | `refactor: OS and CPU catalogs with version scales` | — | #8 (HarmonyOS), #12, #14, and #15 (platforms) tags removed |
| 7 | `refactor: device types, vendors and model extraction` | — | #5 to #8 and #13 tags removed |
| 8 | `refactor: client catalog`; delete `parser/`, `enrich.ts`, `client-hints.ts` | — | #2 (structural) and #10 removed; regex ban global |
| 9 | `feat!: v4 public surface`: `is`/`isBot`, flatten `src/v3`, result type changes, README, MIGRATION, playground, consumer fixtures, budget update | 4.0.0 | Type tests, consumer fixtures (ESM, CJS, TS), `playground:check`, `pack:check` |
| 10 | `feat: labels subpath and generated catalog docs` | 4.1.0 | `docs:catalog --check`, budget |

Deleting files (jest config, old parser files, redundant tests, the duplicate barrel) follows the repository deletion policy in `AGENTS.md`.

## Implementation reconciliation

### PR 5 (browsers, engines, contexts)

Accepted by the operator's go-ahead to start PR 5, and checked against the corpus. None changes the shared contract.

- **IDs stay hand-written until PR 9.** The catalog is typed `Record<BrowserId, BrowserRow>` against the existing union in `constants.ts`, so a missing row is a `tsc` error today. Deriving the union from the catalog keys moves to PR 9, where the const objects go away.
- **`enrich.ts` shrinks instead of disappearing.** It keeps `mergeOS`, `mergeDevice` and `mergeCPU` until PRs 6 and 7 move those dimensions into the pipeline. `mergeBrowser` and `mergeRuntime` are gone. `parse`, `parseRequest` and `detect` all call `core/resolve.ts`.
- **Signals carry the per-row exceptions.** `Signal` gained `valueIs` (Messenger's `FBAN/MessengerForiOS`), `with`, `os`, `versionFrom`, `versionOptional`, and the browser extras `family`, `engine`, `mode`. Safari's Apple-only rule is `os: ['ios', 'ipados', 'macos']` on its row, not code.
- **A Chromium brand is not a candidate.** `Sec-CH-UA` always lists `Chromium`, so it would conflict with every Chrome UA. It only supplies `family` and, for the Chromium product, the version.
- **Hint brands pick like UA tokens.** A stronger source wins an unresolved conflict, so a Brave or Edge brand now replaces a Samsung Internet UA. v3 kept Samsung there. The generic `Google Chrome` brand is a fallback candidate, so it never replaces a specific product.
- **`NEUTRAL_PRODUCTS` includes `nettype`, `language`, `abi`, `mmwebid`, `mmwebsdk` and `liff`.** These ride on WeChat and LINE Chromium UAs and would otherwise read as unknown forks. The WeChat tokens are recalled, not captured, and need real corpus entries.
- **Scanner treats `;` between top-level tokens as a separator.** A bare `FBAN/Orca-Android; FBAV/500.1.0` in a test string would otherwise carry the `;` into the value.
- **Measured cost.** `root-parse` grows from 10,876 to 15,872 raw bytes (gzip 5,852) because the scanner, matcher and resolver are a fixed cost, while `server` and `browser` grow by 1,928. Parse throughput on the mixed corpus went from about 453,000 to 410,000 operations per second. Each added row is expected to cost far less than the machinery, and the next PRs measure it.
- **Behavior changes, all in the corpus diff.** An unlisted Chromium fork reports `name: null, family: 'chromium'`. Edge Legacy reports `edge` with `family: null`. The Android stock browser reports no browser. Safari needs an Apple OS, so a Tizen Safari UA reports none. Opera Mini reports `family: null` and no engine.

## Open questions and risks

1. **Accounted-token rule.** Should it ship in 4.0.0, or wait until the corpus shows its false-null rate on real Chrome traffic? This design ships it, gated by the corpus.
2. **Android without `Mobile`.** It stays a fallback `tablet`, which TV markers, model rules, and the hint `mobile` can correct. Should it be `null` instead?
3. **Unverified real-world strings.** These must be sourced before their rows merge, and they ship with `brands: []` or no row until then:
   - Client Hints brand strings: Samsung Internet, Yandex, Vivaldi, Whale, and Arc.
   - Client Hints platform strings: HarmonyOS, KaiOS, and Tizen.
   - Product tokens: Brave and Arc desktop. Reviewers recall them as identical to Chrome.
   - Automation tokens: Playwright, Puppeteer, and Selenium.
   - Model prefixes: QQ, HeyTap, DuckDuckGo, and Whale tokens; Fire TV `AFT`; Realme `RMX`; `CPH2449` as OnePlus.
   - Windows `platformVersion` 13 or later meaning Windows 11.
4. **Bundle growth.** The estimate is about 60 to 80 bytes per added row; this is extrapolated, not measured. If root-parse grows too far, should bots move to an opt-in subpath?
5. **Prereleases.** Should PRs 5 to 8 publish `4.0.0-next.N` under the `next` dist-tag for canary use by the author's apps? That needs a `--tag` path in `publish.yml`.
6. **Node 18.** It has been end-of-life since 2025-04. Keep `engines >=18` (the code is ES2020), or move to `>=20` and allow newer vitest?

## Next implementation step

PR 1: the 3.0.1 hotfix on the current engine, test-first. Write the timing tests, confirm they fail on `master`, then apply the root fixes.

### PR 6 (OS and CPU)

- **Signals match runs of words as well as products.** The scanner now also yields a flat word list (split at spaces, brackets, `;`, `,` and `/`). OS and CPU rows name a run of up to four words (`windows nt`, `cpu iphone os`, `x86_64`), and the matcher looks each one up in a `Map` keyed by its first word. The design had OS rows match comment parts. Words also match bare test strings such as `Windows Phone OS 10.0` that have no parentheses, as v3 did, and keep per-parse cost flat as rows are added.
- **CPU uses `beats` only where two architectures can share a UA.** `arm64` beats `arm`, `x86_64` and `x86`, and `x86_64` beats `x86`. v3 got this from regex order. The hint merge for CPU keeps v3's rules: a hint without bitness never weakens a compatible UA architecture.
- **Android and HarmonyOS no longer need a version.** `Android;` (Opera Mini) and a bare `HarmonyOS` segment now identify the OS. HarmonyOS beats Android, so an Android Client Hint no longer replaces it (defect #12).
- **Windows uses one marketing scale for both sources.** The NT map gives `10`, `8.1`, `8`, `7`. NT 6.0, 5.2, 5.1 and 5.0 are Windows with no version, not the strings `Vista` or `XP`. A `platformVersion` of 13 or more is `11`, and 1 to 12 is `10` (defect #14). Unknown NT numbers pass through.
- **macOS keeps its decimals.** `Mac OS X 10.15` gives `10.15`. v3 cut it at the dot and gave `10`.
- **Cost.** Same-harness parse throughput on five common UAs went from 272,000 (PR 5) to between 217,000 and 243,000 operations per second across runs, a drop of 10 to 20 percent. The profile shows `find`, `scan` and `splitWords` as the cost. PRs 7 and 8 remove the remaining regex detectors, so the figure is measured again there. The raw bundle grew from 15,872 to 17,473 bytes for `root-parse`.
