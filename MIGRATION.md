# Migrating from `ua-info` to `user-agent-info`

`user-agent-info@2.0.1` is the same version 2 API published under a clearer package name. Parser behavior, result types, and public entry points are unchanged.

## Replace the dependency

```bash
npm uninstall ua-info
npm install user-agent-info@2.0.1
```

For pnpm:

```bash
pnpm remove ua-info
pnpm add user-agent-info@2.0.1
```

For Yarn:

```bash
yarn remove ua-info
yarn add user-agent-info@2.0.1
```

## Replace module specifiers

Before:

```ts
import { parse } from 'ua-info';
import { parseRequest } from 'ua-info/server';
import { detectCurrent } from 'ua-info/browser';
```

After:

```ts
import { parse } from 'user-agent-info';
import { parseRequest } from 'user-agent-info/server';
import { detectCurrent } from 'user-agent-info/browser';
```

CommonJS follows the same change:

```js
const { parse } = require('user-agent-info');
```

## What does not change

- `parse(userAgent)`
- `parseRequest({ headers })`
- `detectCurrent(options?)`
- `UAResult` and exported TypeScript types
- Browser, engine, OS, device, CPU, client, and context semantics
- ESM and CommonJS support
- The absence of the removed `UAInfo` class and `/v2` subpaths

## Old package status

Every published `ua-info` version is deprecated and receives no further releases. Existing lockfiles remain installable, but new work should depend on `user-agent-info`.
