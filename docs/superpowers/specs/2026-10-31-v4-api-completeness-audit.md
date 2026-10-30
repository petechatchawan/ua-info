# v4 API completeness audit

Date: 2026-10-31. Companion to `2026-10-30-v4-catalog-architecture-design.md`. Checks whether the planned public surface returns the data an application needs, before 4.0.0 is published. Evidence is the 3.0.1 build probed on 2026-10-31, labeled **measured**, and the v4 design text, labeled **design**.

## What an application asks of a parser

| Need | v3.0.1 | Planned v4 | Verdict |
| --- | --- | --- | --- |
| Browser name and major version | `browser.name`, `version.major` (measured) | same | Complete |
| Minor or patch version (for example Safari 17.4, a feature that landed in a minor) | `Version` has only `full` and `major` (measured: keys `full`, `major`) | `Version { full, major }` | **Gap.** Callers must split `full` themselves. |
| Rendering engine and its version | Blink version is always `null` (measured) | engine version from tokens | Acceptable. Chrome's Blink version equals the Chrome version, so callers can use `browser.version`. Document it. |
| OS name and version | present. macOS reports the frozen `10.15.7` and Windows 11 reports `10` from the UA alone (measured) | hints refine Windows | Acceptable with a note. Only Client Hints can tell Windows 11 or a real macOS version. Document it in the README. |
| Device type | `mobile`, `tablet`, `desktop`, `smart-tv`, ... | same | Complete. iPadOS desktop mode reports `desktop` and a Mac (measured). The UA cannot tell, so document it. |
| Device vendor and model | display string vendor, raw model | lowercase `VendorId`, raw model | Complete for routing. No marketing name ("Galaxy S24 Ultra"), by design: it needs a database. |
| Is this a bot, and which | `isBot`, `client.type`, `client.name` | `isBot`, `client.token` | Complete |
| In-app browser and which app | `context.name`, `host` | `context.app`, `context.version` | Complete |
| Compare versions ("Chrome at least 100") | `browser.version?.major ?? 0` | same | Works. A helper would save a null check, but it is sugar, not data. |
| Display text for the UI | none | `labels` subpath, last PR | Planned. Complete once PR 10 lands. |
| TypeScript narrowing | named predicates narrow nothing (they return `boolean`) | `is()` narrows each touched field | Complete |
| Unknown browser on a known engine | Samsung TV Tizen UA gives `browser.name: null` with `os: tizen` and `device: smart-tv` (measured) | `null` by design | Acceptable. `family` stays null here, so a caller cannot tell Chromium-based from not. |

## Decisions

1. **Add `Version.minor` and `Version.patch`** (both `number | null`) in PR 9, next to the `Version.major: number` change. Parsing is one function, so the cost is two fields. This is the only data gap.
2. **Document the three limits above** in the README "Trust boundary" section: frozen macOS and Windows versions, iPadOS desktop mode, Blink engine version. These are limits of the User-Agent string, not parser defects.
3. **No other field is added.** Marketing names, screen size, and touch support are outside what a User-Agent carries.

## Public functions after PR 9

| Subpath | Functions | Complete? |
| --- | --- | --- |
| `.` | `parse` | Yes |
| `./check` | `is`, `isBot` | Yes. `is` takes `browser`, `family`, `mode`, `engine`, `os`, `device`, `vendor`, `client`, `clientType`, `context`, `contextType`, `app`. Every `UAInfo` field a caller branches on has a key. |
| `./server` | `parseRequest` | Yes |
| `./browser` | `detect` | Yes |
| `./labels` | `labels` | After PR 10 |

## Before publishing 4.0.0

Run this checklist against the packed tarball, not the source:

- every documented example in the README compiles under `tsc` and gives the stated result;
- `is()` rejects a misspelled ID at compile time (type test);
- `MIGRATION.md` maps every removed 3.x export to its replacement (a test lists the 3.0.1 exports and requires each to appear in the table);
- the playground and the three consumer fixtures pass against the tarball.
