# UA Info Identity Restoration Design

**Status:** APPROVED

## Decision

Restore `ua-info` as the permanent canonical npm package identity. The display name is **UA Info**, expanded as **User-Agent Information**. The failed `user-agent-info` rename is superseded because npm rejected that unscoped name as too similar to an existing package.

## Canonical identity

- npm package: `ua-info`
- display name: `UA Info`
- expanded meaning: `User-Agent Information`
- next release: `2.0.2`
- canonical repository after cutover: `petechatchawan/ua-info`
- Node.js support: `>=18`
- CI matrix: Node.js 18, 20, and 22

## Public API contract

The identity restoration changes package metadata, documentation, package verification, consumer fixtures, and release automation only. Runtime and parser behavior remain unchanged.

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

The package exports remain limited to:

- `.`
- `./server`
- `./browser`
- `./package.json`

The removed `UAInfo` class and `/v2` public subpaths must not return.

## Runtime invariants

- `parse()` remains pure and must not read browser globals.
- Browser identity remains in `browser`.
- LINE, LIFF, Electron, PWA, and embedded surfaces remain in `context`.
- Bots, crawlers, automation tools, HTTP clients, and libraries remain in `client`.
- ESM, CommonJS, and TypeScript declarations remain supported.
- Parser implementation files under `src/v2/**` are out of scope.

## Source migration

The implementation must:

1. Set `package.json` to `ua-info@2.0.2`.
2. Restore repository, homepage, and issue URLs to `petechatchawan/ua-info`.
3. Describe the package as a User-Agent information parser.
4. Restore README badges, installation commands, imports, and canonical links to `ua-info`.
5. State near the top of README that “UA Info” means “User-Agent Information.”
6. Delete `MIGRATION.md`, which incorrectly directs users away from the canonical package.
7. Remove `MIGRATION.md` from packed files and package-content assertions.
8. Update `docs/v2-design.md`, packed consumers, package-root tests, and identity checks to use `ua-info`.
9. Mark the previous `user-agent-info` design and plan as superseded historical records rather than deleting them.
10. Configure the publish workflow to permit publishing only when both conditions hold:
    - package name is exactly `ua-info`;
    - repository is exactly `petechatchawan/ua-info`.

## Version and publication policy

`ua-info@2.0.1` already exists, so the restored release must be `2.0.2`. The repository will remain named `petechatchawan/user-agent-info` while the source PR is reviewed and merged. The publish guard must therefore prevent publication until the repository is manually renamed back to `petechatchawan/ua-info`.

After repository rename:

1. Verify the stable GitHub repository ID still resolves to `petechatchawan/ua-info`.
2. Verify `ua-info@2.0.2` does not already exist.
3. Verify npm Trusted Publishing is configured for owner `petechatchawan`, repository `ua-info`, and workflow `publish.yml`.
4. Publish `ua-info@2.0.2`.
5. Verify clean installations of root, server, and browser entry points in ESM, CommonJS, and TypeScript consumers.
6. Verify `/v2` remains unavailable.
7. Remove and revoke the temporary `NPM_TOKEN` after OIDC publishing is confirmed.

## Historical records

The following documents remain in the repository as audit history but must begin with a supersession notice:

- `docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md`
- `docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md`

Required notice:

```text
Status: SUPERSEDED
Reason: npm rejected the unscoped user-agent-info package name as too similar to an existing package.
Canonical package identity: ua-info
```

## Verification gates

Before merge:

- identity verifier passes for `ua-info@2.0.2`;
- lint passes;
- 43 existing tests pass without parser changes;
- ESM and CommonJS builds pass;
- packed package contains README and LICENSE but not MIGRATION;
- packed consumers pass for root, server, browser, ESM, and CommonJS;
- stale active references to `user-agent-info` are absent outside approved superseded records;
- CI passes on Node.js 18, 20, and 22;
- publish workflow is skipped while the repository retains the temporary `user-agent-info` name.

## Out of scope

- parser changes;
- result-model changes;
- new browser, bot, device, or context detections;
- restoring v1 APIs;
- publishing any package named `user-agent-info`;
- deprecating or unpublishing `ua-info`.
