# UA Info Production Acceptance & Repository Polish Design

## Status

Approved for implementation on 2026-07-24.

## Goal

Close the UA Info Playground launch by recording production acceptance and making npm package metadata lead users to the deployed interactive Playground.

## Production acceptance

The production project site is `https://petechatchawan.github.io/ua-info/`. The owner confirmed that the deployed site opens successfully after GitHub Pages was enabled and the deployment workflow was run.

The implementation from PR #28 already provides automated acceptance coverage for the `/ua-info/` base path, packed-package consumption, browser smoke tests, LINE LIFF identity separation, 320 px rendering, and third-party network isolation.

## Repository polish

Change the package `homepage` field from the GitHub README URL to the production Playground URL. Keep the repository and issue metadata unchanged so npm continues to expose dedicated Repository and Bugs links.

The root README already contains an Interactive Playground section with the production URL, so no duplicate documentation section is required.

## Constraints

- Do not change the package version.
- Do not modify parser/runtime source code.
- Do not change package exports or publish configuration.
- Do not trigger an npm release solely for this metadata change.
- Run the existing package identity, test, build, pack, and consumer gates before merge.

## Success criteria

- `package.json.homepage` equals `https://petechatchawan.github.io/ua-info/`.
- Existing repository and bugs URLs remain unchanged.
- Root CI and packed-consumer checks pass.
- The change is delivered in a focused pull request.