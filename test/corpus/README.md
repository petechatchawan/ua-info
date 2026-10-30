# User-Agent corpus

Each `*.jsonl` file holds one JSON object per line. `test/corpus.test.ts` runs every entry through `parse()` (or `parseRequest()` when the entry has `headers`) and checks the result with `toMatchObject`.

```json
{"id":"samsung-internet","ua":"Mozilla/5.0 (...)","src":"synthetic:composed from the documented Samsung Internet format; replace with a captured string","expect":{"browser":{"name":"samsung-internet"}}}
```

| Field | Meaning |
| --- | --- |
| `id` | Unique kebab-case name across all files. |
| `ua` | The User-Agent string, exactly as received. |
| `headers` | Optional lowercase `sec-ch-ua-*` headers. Their presence selects `parseRequest()`. |
| `src` | Provenance, required. See below. |
| `expect` | The expected `UAInfo` without `ua`. Compared with `toMatchObject`, so an open entry can name only the fields that are wrong. |
| `defect` | Optional `#N` of the review defect that this entry pins. |
| `open` | `true` while the parser is still wrong. The entry then holds the **desired** result and runs under `it.fails`. |

## Provenance

`src` is one of:

- `observed:<where>@<yyyy-mm-dd>`: captured from real traffic, for example `observed:nginx access log@2026-11-03`.
- `doc:<url>`: copied verbatim from a vendor page.
- `synthetic:<why>`: composed from a documented format. It proves the parser handles the format, not that a real client sends it.

Every current entry is `synthetic`. Replace them with captured strings as you collect them. A row in the v4 catalog is only trusted once a non-synthetic entry proves it.

## Open entries

An open entry fails on purpose. When a change fixes the defect, the entry starts passing, `it.fails` reports `Expect test to fail`, and the change must remove `"open":true`. That keeps a fix from being forgotten and keeps a later regression visible.

`test/regressions.test.ts` lists the behavioral defects from the 2026-10-30 review and requires each to be pinned by at least one entry.

## Adding an entry

```bash
npm run build
npm run corpus:add -- --topic browsers --id duckduckgo-android \
  --src "observed:support ticket 4811@2026-11-03" "Mozilla/5.0 (...)"
```

The tool writes the **current** result as the expectation. Read it before committing. If it is wrong, edit the entry by hand: put the desired fields in `expect`, add `defect` and `"open":true`, and say in `src` where the string came from.

Pass `--header 'sec-ch-ua-platform="Windows"'` (repeatable) to add Client Hints. The header value includes its own quotes.
