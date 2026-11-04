# Coverage: base browsers, OS, vendors

Target: cover every product that appears often enough in real logs to be worth a catalog row.

Data source: StatCounter, October 2026, worldwide (`ww`) and Thailand (`th`). Percentages are
the highest figure across the desktop and mobile cuts for that product. UA tokens are the literal
strings clients send, taken from captured traffic and vendor documentation.

Rule for a row: one product id, one or more UA tokens, a tier.

## Snapshot

Tier 1 shipped. The counts below are the catalog today.

| Dimension | Now | Tier 2 left | After tier 2 |
|---|---|---|---|
| Browsers | 28 | 8 | 36 |
| Operating systems | 20 | 4 | 24 |
| Device vendors | 22 | 5 | 27 |
| In-app contexts | 6 | 1 | 7 |

This table is **capability**: every row is implemented. `test/data/user-agents.json` holds real captured
strings and pins the behaviour that matters; it is not a coverage score.

## 1. Browsers

### Have (28)

`360`, `arc`, `brave`, `chrome`, `chromium`, `coc-coc`, `duckduckgo`, `ecosia`, `edge`,
`edge-legacy`, `firefox`, `huawei-browser`, `ie`, `mi-browser`, `opera`, `opera-gx`,
`opera-mini`, `pale-moon`, `puffin`, `qq`, `safari`, `safari-mobile`, `samsung-internet`, `uc-browser`,
`vivaldi`, `whale`, `yandex-browser`

`chrome-mobile` and `safari-mobile` are form-factor variants, not separate products. A phone build
carries the `Mobile` token: Chrome on Android or HarmonyOS reports `chrome-mobile`, Safari on iOS or
iPadOS reports `safari-mobile`, and the desktop and tablet builds keep `chrome` and `safari`.

These cover roughly 99% of measured traffic. The tail below is where forks, in-app WebViews and
old enterprise clients live.

### Tier 1 — shipped (12)

| id | UA token | ww % | th % | Notes |
|---|---|---|---|---|
| `ie` | `MSIE ` / `Trident/` + `rv` | 0.02 | 0.01 | Engine is `null`; IE 11 has no `MSIE` token |
| `edge-legacy` | `Edge/` | 0.02 | 0.01 | Engine `edgehtml`; family `null`, not `chromium` |
| `opera-mini` | `Opera Mini` / `OPiOS` | — | — | `presto` for the classic token, `webkit` for `OPiOS` |
| `opera-gx` | `OPX/` | — | — | Chromium fork |
| `360` | `360SE` / `360EE` / `QHBrowser` / `QihooBrowser` | 0.37 | — | Version is the Chrome build it wraps |
| `coc-coc` | `coc_coc_browser` | 0.11 | — | Vietnamese/Thai Chromium fork |
| `qq` | `MQQBrowser` / `QQBrowser` | 0.15 | — | Suppressed when `MicroMessenger` is present |
| `pale-moon` | `PaleMoon/` | 0.05 | 2.54 | Goanna is a Gecko fork, reported as `gecko` |
| `duckduckgo` | `Ddg/` / `DuckDuckGo/` | — | — | iOS sends `Macintosh`, so the platform it reports is macOS |
| `whale` | `Whale/` | 0.06 | — | Naver; Chromium fork |
| `ecosia` | `Ecosia/` / `(Ecosia android@…)` | 0.06 | — | Chromium fork with a distinct token |
| `puffin` | `Puffin/` | 0.01 | — | Proxy browser; engine and family are `null` |

### Tier 2 — add (8)

| id | UA token | Why later |
|---|---|---|
| `sogou` | `MetaSr` / `SE 2.X` | China-only, 0.05 |
| `baidu` | `baidubrowser` / `BIDUBrowser` | China-only |
| `maxthon` | `Maxthon` | Small but long-lived |
| `silk` | `Silk/` | Fire tablets and Fire TV |
| `aloha` | `AlohaBrowser/` | Privacy browsers on iOS |
| `qwant` | `QwantMobile/` / `QwantiOS/` | EU privacy browser |
| `heytap` | `HeyTapBrowser/` | ColorOS system browser |
| `quark` | `Quark/` | Alibaba; mostly China |

### Skip

IE Mobile, NetFront, Konqueror, Lynx, Links, Sleipnir, Lunascape, SlimBrowser, Otter, Dooble,
Falkon, Epiphany, Midori. Either dead or below 0.01% on every cut, with no in-app presence.

### In-app contexts (separate dimension)

Context rows are not browsers. They describe the host app wrapping the WebView.

Have (6): `facebook`, `instagram`, `line`, `messenger`, `tiktok`, `wechat`

| id | UA token | Tier | Status |
|---|---|---|---|
| `tiktok` | `musical_ly_*` / `tiktok*` / `BytedanceWebview` | 1 | Shipped; `app_version/<semver>` wins, the token suffix is the fallback |
| `zalo` | `Zalo` | 2 | Needs a captured string; none in the public fixture suites |

## 2. Operating systems

### Have (20)

`android`, `blackberry`, `chromeos`, `firefox-os`, `fuchsia`, `harmonyos`, `ios`, `ipados`,
`kaios`, `linux`, `macos`, `openharmony`, `steamos`, `symbian`, `tizen`, `tvos`, `watchos`,
`webos`, `windows`, `windows-phone`

### Tier 1 — shipped (10)

| id | UA token | Notes |
|---|---|---|
| `windows-phone` | `Windows Phone` / `XBLWP7` / `ZuneWP7` / `IEMobile` | Beats `windows`, `android` and `ios` |
| `blackberry` | `BB10` / `BlackBerry` / `RIM Tablet OS` | — |
| `symbian` | `SymbianOS` / `Symbian` / `Series60` | — |
| `webos` | `webOS` / `hpwOS` / `web0S` | Beats `linux`; pairs with `smart-tv` |
| `firefox-os` | `Firefox OS`, or mobile `rv:` + `Firefox` with no platform token | Excludes KaiOS |
| `steamos` | `SteamDeck` / `Valve Steam` | Beats `linux`; device type `console` |
| `fuchsia` | `Fuchsia` | Chromecast |
| `openharmony` | `OpenHarmony` | Beats `windows`, `android` and `harmonyos` |
| `watchos` | `watchOS/` | Device type `wearable` |
| `tvos` | `AppleTV/` | Device type `smart-tv` |

### Tier 2 — add (4)

`sailfish`, `ubuntu-touch`, `series40`, `windows-ce`

### Skip

Bada, Maemo, MeeGo, Roku OS, Vega OS, NetCast. Below 0.01% or single-vendor TV firmware with no
real traffic.

## 3. Device vendors

### Have (22)

`apple`, `amazon`, `asus`, `google`, `honor`, `huawei`, `infinix`, `itel`, `lg`, `meta`,
`motorola`, `nokia`, `nothing`, `oneplus`, `oppo`, `realme`, `samsung`, `sony`, `tecno`, `vivo`,
`xiaomi`, `zte`

### Tier 1 — shipped (9)

| id | Model prefixes / tokens | ww % | th % |
|---|---|---|---|
| `infinix` | `Infinix `, `X68`, `X6`, `X5`, `X7`, `X3` | 2.10 | 2.86 |
| `honor` | `HONOR `, `GDI-`, `JDN-`, `BKL-` | 2.06 | 1.17 |
| `tecno` | `TECNO `, `KC` | 1.61 | 0.59 |
| `nothing` | `A06`, `A05`, `A02`, `A14`, `A01` | 0.39 | 0.06 |
| `zte` | `ZTE `, `BLADE` | 0.17 | 0.41 |
| `asus` | `ASUS` | 0.04 | 0.06 |
| `nokia` | `Nokia `, `Nokia-` | 0.10 | 0.04 |
| `lg` | `LG-`, `LM-` | 0.07 | — |
| `itel` | `itel `, `A6`, `A5`, `A7`, `A1`, `P5`, `L6` | 0.28 | 0.03 |

### Tier 2 — add (5)

`lenovo` (`Lenovo `, `TB-`), `sharp` (`SH-`, `AQUOS`), `tcl` (`TCL `), `nubia` (`Nubia `, `NX`), `wiko` (`WIKO`)

### Skip

Alcatel, HTC, Lava, BBK, T-Mobile, Oale, Meizu, BlackBerry, Palm. Each below 0.05% on both cuts
or long discontinued.

## 4. What "done" means per row

A row is done when it is in the catalog and `npm test` passes. The catalog checks every `beats`
reference, label, Client Hints brand, and vendor model prefix, so a broken row fails the build.

Real captured strings live in `test/data/user-agents.json` and are checked by `test/unit/user-agents.test.ts`.
Adding one is a single entry in that file. Nothing composed goes in: a string that was not captured
proves nothing about a real client.

## 5. Engine ids

Current: `blink`, `edgehtml`, `gecko`, `presto`, `webkit`.

`edgehtml` and `presto` were added with the two legacy browsers. `trident` is deliberately absent:
only IE needs it, and IE reports `null` instead of a version nobody branches on.

`pale-moon` sends `Goanna/` (a Gecko fork) and reports `gecko`, because no consumer branches on
Goanna. `puffin` reports `null` for engine and family because its rendering is server-side.

## 6. Fixture provenance

`test/data/user-agents.json` holds this project's own captures and nothing else. Each entry has a `src`:

- `observed:<where>@<date>` is the norm: a string captured from real traffic. 27 entries today.
- `doc:<url>` is valid for a string quoted verbatim by a vendor page or a standard. No entry uses it.
- Nothing composed goes in: a made-up string proves nothing about a real client.

Because every entry is ours, no third-party licence reaches the test data. Keep it that way: a new
entry must be captured, not copied from another library.

## 7. Known limits

- DuckDuckGo on iOS claims `Macintosh`, so the platform reads `macos` and the engine `blink`: that
  is what the string says, and an app-to-OS guess table would be a lie.
- `symbian`, `blackberry` and `webos` report `device.type: null` when the string names no
  form-factor marker. Guessing `mobile` from the OS alone would misclassify tablets.
- Vendor rows match model-code prefixes, so an unknown prefix from a known brand reports
  `device.vendor: null` rather than a guess.
- A phone string that omits every `Mobile` token (Samsung Internet on `Pixel 8 Pro`) reports
  `device.type: 'tablet'`: Android without a form-factor marker is the documented tablet shape.
  Fixing it needs a per-browser override, which would guess for tablets too.
- The model inside an in-app parenthetical is not scanned. Instagram sends
  `... Android (37/17; ...; samsung; SM-S948B; ...)`, but model extraction reads only the comment
  group that carries the OS token, so `device.vendor` and `model` stay `null`.