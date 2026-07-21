# Application and runtime browser context

A user-agent string can identify more than one client layer at the same time. For example, a LINE LIFF page on Android can expose all of the following:

- host application: LINE 26.11.0
- application context: LIFF
- runtime browser: Chrome Webview 150.0.7871.46
- operating system: Android 16

`ua-info` 1.2 keeps the existing `browser` result for backward compatibility and adds two optional fields:

```ts
const info = new UAInfo().setUserAgent(userAgent);

info.getBrowser();
// Line 26.11.0 (legacy 1.x primary-client result)

info.getApplication();
// Line 26.11.0, context: liff

info.getRuntimeBrowser();
// Chrome Webview 150.0.7871.46
```

## Result semantics

- `browser`: legacy primary-client identity. In 1.x, an in-app host such as LINE can be returned here.
- `application`: native or host application containing the web content.
- `runtimeBrowser`: browser or WebView runtime executing the page.

This model avoids forcing LINE and Chrome Webview to compete for one field even though they describe different layers.

## LIFF detection

`isLiff()` and `hasLiffToken()` inspect the `LIFF` marker in the user-agent string. This is a user-agent heuristic and does not replace authoritative runtime detection from the LIFF SDK, such as `liff.isInClient()`.

## Compatibility

The 1.2 API is additive. Existing consumers continue to receive LINE from `getBrowser()` for LINE in-app user agents. A future major version can redefine `browser` as the runtime browser after a migration period.
