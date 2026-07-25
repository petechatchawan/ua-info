# ua-info v2.2.0 Release Design

**Status:** Implemented and verified  
**Date:** 2026-07-25  
**Repository:** `petechatchawan/ua-info`  
**Target release:** `ua-info@2.2.0`

## 1. Purpose

Publish the typed predicate helper work already merged through PR #37 as `ua-info@2.2.0` without changing runtime behavior, public result shapes, package entry points, dependency policy, or deployment architecture.

The release PR prepares one exact package release commit. npm publication, clean-registry verification, the `v2.2.0` GitHub Release, and closure documentation occur only after that PR is reviewed and merged.

## 2. Release Contract

`2.2.0` is an additive minor release.

- Package identity remains `ua-info`.
- Version changes from `2.1.0` to `2.2.0`.
- Root, `/server`, `/browser`, and `/package.json` exports remain unchanged.
- Removed `/v2` subpaths remain removed.
- Node.js support remains `>=18` and CI remains Node.js 18, 20, and 22.
- npm publication remains Trusted Publishing/OIDC-only with provenance.
- No runtime dependency is added.
- No detector, parser, result-model, Playground behavior, or public constant changes are included.
- The exact package release commit must be the merge commit of the release PR.

## 3. Release Contents

The release exposes the nine typed predicates already implemented and verified in PR #37:

- `isBrowser`
- `isBrowserFamily`
- `isBrowserMode`
- `isEngine`
- `isOperatingSystem`
- `isDeviceType`
- `isCPUArchitecture`
- `isClientKind`
- `isContextKind`

Successful predicates narrow nullable result dimensions and the compared literal property. ID-like predicates accept custom string literals; closed semantic dimensions retain their existing union types.

## 4. Repository Changes

The release PR modifies only release metadata and package guards:

```text
package.json
CHANGELOG.md
scripts/verify-package.mjs
scripts/verify-package-identity.mjs
scripts/verify-consumers.mjs
docs/superpowers/specs/2026-07-25-ua-info-v2-2-release-design.md
docs/superpowers/plans/2026-07-25-ua-info-v2-2-release.md
```

No root lockfile exists. The private Playground lockfile is not changed because the Playground continues installing the generated root package tarball through the existing setup workflow.

## 5. Version and Guard Synchronization

Every active release guard requires `2.2.0`:

- `package.json` manifest version;
- package identity verifier expected version and success output;
- package dry-run verifier manifest and tarball expectations;
- packed consumer verifier tarball expectation.

Historical design and implementation documents retain their recorded `2.1.0` references and are not rewritten.

## 6. Changelog

The changelog has a top section dated `2026-07-25`.

### Added

- Nine pure, tree-shakeable typed predicate helpers exported from the package root.
- Compile-time narrowing for nullable result dimensions and matched literal values.
- Support for custom/future string IDs in browser, browser-family, engine, operating-system, and CPU-architecture predicates.
- Closed-union input validation for browser mode, device type, client kind, and context kind.

### Compatibility

- No `UAResult`, detector behavior, package entry-point, or runtime dependency changes.
- ESM, CommonJS, TypeScript Node16/NodeNext, server, browser, packed-consumer, and Playground contracts remain supported.

### Security note

Predicates query parsed User-Agent and Client Hints claims. They do not authenticate a browser, client, device, context, or request origin.

## 7. Verification Gates

Before the release PR is ready for review, the exact implementation head must pass:

1. package identity verification;
2. lint;
3. fixture contract and production coverage thresholds;
4. unit and compile-time predicate contracts;
5. ESM and CommonJS builds;
6. npm tarball contents and identity checks;
7. clean packed consumers for root, `/server`, `/browser`, ESM, CommonJS, and TypeScript Node16;
8. Node.js 18, 20, and 22 CI matrix;
9. Playground boundary, type-check, unit, build, and production smoke gates;
10. scope audit showing no runtime implementation or workflow changes.

## 8. Post-Merge Publication

After the release PR is squash-merged:

1. publish `ua-info@2.2.0` through the existing OIDC workflow;
2. wait for npm registry propagation;
3. install and verify the public package on Node.js 18, 20, and 22;
4. verify all nine predicates in ESM, CommonJS, and TypeScript Node16 consumers;
5. create GitHub Release `v2.2.0` targeting the exact package release commit;
6. verify the tag target;
7. record and close live-verification evidence;
8. remove any one-time verification workflow and close release documentation in a separate PR.

## 9. Out of Scope

- Performance benchmark infrastructure and bundle-size budgets.
- New predicates, aliases, matcher combinators, or fluent APIs.
- Detector corrections or fixture additions.
- Playground feature changes.
- Automatic npm publication before release PR approval and merge.
- Rewriting historical version references in archived plans and specifications.

## 10. Verification Record

- Pull request: `#38 release: publish ua-info 2.2.0`.
- Base commit: `3423325303d4bcfee690dcb5be54e40610e3c4b1`.
- RED head: `35caf496e866a6674bd221069058136e2dccef2b`.
- RED CI: run `30162614627` / CI `#209`; detector coverage and unit/build gates passed, while package verification failed at the intentional `2.1.0` guard mismatch.
- Verified implementation head: `60d4f45e2b449be35b54098b88422319b7b511cd`.
- GREEN CI: run `30162700786` / CI `#213`.
- Node.js 18, 20, and 22 passed lint, Jest, ESM/CommonJS build, package checks, and packed-consumer verification.
- Packed consumers verified all nine predicate exports, representative runtime behavior, CommonJS access, and TypeScript Node16 narrowing.
- Detector fixture and production coverage gates passed.
- Playground package preparation, boundary validation, type-check, tests, production build, Chromium installation, and production smoke passed.
- Scope audit: seven expected release files only; branch was ahead of `master` and behind by zero.

## 11. Acceptance Criteria

The release PR is complete when all release surfaces require `2.2.0`, the changelog accurately describes the typed predicate API, final CI is green on the closure head, and the diff contains only the seven files listed in this design.
