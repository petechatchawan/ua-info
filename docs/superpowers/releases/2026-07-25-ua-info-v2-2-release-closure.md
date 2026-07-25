# ua-info v2.2.0 Release Closure

**Status:** Released and live-verified  
**Date:** 2026-07-25  
**Package:** `ua-info@2.2.0`

## Release lineage

- Typed predicate implementation: PR #37
- Implementation merge commit: `3423325303d4bcfee690dcb5be54e40610e3c4b1`
- Release preparation: PR #38
- Exact package release commit: `4dc6077140d54e2937b493fa88e81624ee51bf59`
- One-time live verification: PR #40
- Verification workflow merge commit: `597dc668aae89ef05e5c3bfec44f79287d03d61e`

## Publication evidence

`ua-info@2.2.0` was published through npm Trusted Publishing using GitHub Actions OIDC and provenance.

- Publication workflow run: `30164363827`
- Release report: issue #39
- Validation outcome: success
- Version existed before publication: false
- Publish step outcome: success
- Registry status: published

## Live verification evidence

The public npm package was installed into clean workspaces and verified independently of the repository build.

- Live verification workflow run: `30164568925`
- Live verification report: issue #41
- Result: passed
- Node.js matrix: 18, 20, 22

Verified contracts:

- all nine typed predicate helpers are exported from the package root;
- representative predicate behavior for browser, family, mode, engine, operating system, device, CPU, client and context;
- TypeScript literal narrowing for nullable result dimensions;
- ESM and CommonJS consumers;
- TypeScript Node16 consumer;
- root, `/server`, `/browser` and `/package.json` entry points;
- removed `/v2` subpath remains unavailable;
- npm package metadata and canonical repository identity;
- no deprecation marker;
- GitHub Release `v2.2.0` exists and its tag points exactly to `4dc6077140d54e2937b493fa88e81624ee51bf59`.

## Compatibility statement

The release is additive. It does not change `UAResult`, parser or detector behavior, package entry points, Node.js support, or runtime dependencies.

User-Agent and Client Hints values remain untrusted claims. Predicate matches do not authenticate a browser, client, device, context or request origin.

## Cleanup

The one-time workflow `.github/workflows/verify-release-v2.2.0.yml` is removed in the release-closure change after successful live verification. The canonical reusable npm publication workflow remains `.github/workflows/publish.yml`.
