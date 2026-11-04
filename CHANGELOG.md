# Changelog

All notable changes to `ua-inspect` are documented in this file.

## 1.0.0 — 2026-11-04

First release. Zero-dependency User-Agent parser for TypeScript, in Node.js and browsers.

### Features

- `parse()` reads a User-Agent string. `parseRequest()` adds Client Hints from request headers. `detect()` reads the current browser.
- Dimensions: browser, rendering engine, operating system, device, CPU, non-browser client, and execution context.
- Bot, WebView, in-app (LINE, LIFF, Facebook, Instagram, Messenger, WeChat), and PWA detection.
- `ua-inspect/check` exposes `is()` with compile-time narrowing and `isBot()`.
- `ua-inspect/labels` maps ids to display text.
- ESM, CommonJS, and TypeScript declarations. Node.js 18 or newer.
