import type { UAInfo } from '../services/ua-detection-service';
import type { PlaygroundMode } from './playground-state';

const NOT_DETECTED = 'Not detected';

function humanize(value: string | null | undefined): string {
  if (!value) return NOT_DETECTED;
  const special: Readonly<Record<string, string>> = {
    webview: 'WebView',
    pwa: 'PWA',
    'in-app-browser': 'In-App Browser',
    'mini-app': 'Mini App',
    'ai-crawler': 'AI Crawler',
    'ai-assistant': 'AI Assistant',
    'http-client': 'HTTP Client',
    'email-client': 'Email Client',
    'media-player': 'Media Player',
    'smart-tv': 'Smart TV',
    xr: 'XR',
    x86_64: 'x86_64',
    arm64: 'ARM64',
    ipados: 'iPadOS',
    ios: 'iOS',
    macos: 'macOS',
    chromeos: 'ChromeOS',
    liff: 'LIFF',
    line: 'LINE',
  };
  return (
    special[value] ??
    value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function formatProduct(
  product: { readonly name: string | null; readonly version: { readonly full: string } | null },
): string {
  if (!product.name) return NOT_DETECTED;
  const name = humanize(product.name);
  return product.version?.full ? `${name} ${product.version.full}` : name;
}

export interface DetectionSummaryViewModel {
  readonly browser: string;
  readonly mode: string;
  readonly contextHost: string;
  readonly contextSurface: string;
  readonly os: string;
  readonly device: string;
}

export interface ResultRowViewModel {
  readonly label: string;
  readonly value: string;
  readonly detected: boolean;
}

export interface ResultCardViewModel {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly ResultRowViewModel[];
}

function row(label: string, value: string | null | undefined): ResultRowViewModel {
  const normalized = value && value.trim() ? value : NOT_DETECTED;
  return { label, value: normalized, detected: normalized !== NOT_DETECTED };
}

export function createDetectionSummary(result: UAInfo): DetectionSummaryViewModel {
  return {
    browser: formatProduct(result.browser),
    mode: humanize(result.browser.mode),
    contextHost: result.context.host ? formatProduct(result.context.host) : NOT_DETECTED,
    contextSurface: humanize(result.context.name),
    os: formatProduct(result.os),
    device: humanize(result.device.type),
  };
}

export function createResultCards(result: UAInfo): readonly ResultCardViewModel[] {
  return [
    {
      id: 'browser',
      title: 'Browser',
      rows: [
        row('Name', result.browser.name ? humanize(result.browser.name) : null),
        row('Version', result.browser.version?.full),
        row('Family', humanize(result.browser.family)),
        row('Mode', humanize(result.browser.mode)),
      ],
    },
    {
      id: 'context',
      title: 'Context',
      rows: [
        row('Type', humanize(result.context.type)),
        row('Surface', result.context.name ? humanize(result.context.name) : null),
        row('Host', result.context.host ? formatProduct(result.context.host) : null),
      ],
    },
    {
      id: 'client',
      title: 'Client',
      rows: [
        row('Type', humanize(result.client.type)),
        row('Name', result.client.name),
        row('Version', result.client.version?.full),
      ],
    },
    {
      id: 'engine',
      title: 'Engine',
      rows: [
        row('Name', result.engine.name ? humanize(result.engine.name) : null),
        row('Version', result.engine.version?.full),
      ],
    },
    {
      id: 'os',
      title: 'Operating System',
      rows: [
        row('Name', result.os.name ? humanize(result.os.name) : null),
        row('Version', result.os.version?.full),
      ],
    },
    {
      id: 'device',
      title: 'Device',
      rows: [
        row('Type', humanize(result.device.type)),
        row('Vendor', result.device.vendor),
        row('Model', result.device.model),
      ],
    },
    {
      id: 'cpu',
      title: 'CPU',
      rows: [
        row('Architecture', humanize(result.cpu.architecture)),
        row('Bitness', result.cpu.bitness ? `${result.cpu.bitness}-bit` : null),
      ],
    },
  ];
}

export function createCodeExample(input: {
  readonly mode: PlaygroundMode;
  readonly userAgent: string;
  readonly hasClientHints: boolean;
}): string {
  if (input.mode === 'current') {
    return `import { detect } from 'user-agent-parser-ts/browser';\n\nconst result = await detect();`;
  }
  if (input.hasClientHints) {
    return (
      `import { parseRequest } from 'user-agent-parser-ts/server';\n\n` +
      `const result = parseRequest({\n` +
      `  userAgent: ${JSON.stringify(input.userAgent)},\n` +
      `  headers: clientHints,\n` +
      `});`
    );
  }
  return (
    `import { parse } from 'user-agent-parser-ts';\n\n` +
    `const result = parse(${JSON.stringify(input.userAgent)});`
  );
}
