import type { UAResult } from '../services/ua-detection-service';
import type { PlaygroundMode } from './playground-state';

const NOT_DETECTED = 'Not detected';

function humanize(value: string | null | undefined): string {
  if (!value) return NOT_DETECTED;
  const special: Readonly<Record<string, string>> = {
    webview: 'WebView',
    pwa: 'PWA',
    'in-app-browser': 'In-App Browser',
    'ai-agent': 'AI Agent',
    'http-client': 'HTTP Client',
    'email-client': 'Email Client',
    'media-player': 'Media Player',
    'smart-tv': 'Smart TV',
    xr: 'XR',
    x86_64: 'x86_64',
    arm64: 'ARM64',
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
  product: { readonly name: string; readonly version: { readonly raw: string } | null } | null,
): string {
  if (!product) return NOT_DETECTED;
  return product.version?.raw ? `${product.name} ${product.version.raw}` : product.name;
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

export function createDetectionSummary(result: UAResult): DetectionSummaryViewModel {
  return {
    browser: formatProduct(result.browser),
    mode: humanize(result.browser?.mode),
    contextHost: formatProduct(result.context?.host ?? null),
    contextSurface: result.context?.name ?? NOT_DETECTED,
    os: formatProduct(result.os),
    device: humanize(result.device.type),
  };
}

export function createResultCards(result: UAResult): readonly ResultCardViewModel[] {
  return [
    {
      id: 'browser',
      title: 'Browser',
      rows: [
        row('Name', result.browser?.name),
        row('Version', result.browser?.version?.raw),
        row('Family', humanize(result.browser?.family)),
        row('Mode', humanize(result.browser?.mode)),
      ],
    },
    {
      id: 'context',
      title: 'Context',
      rows: [
        row('Kind', humanize(result.context?.kind)),
        row('Surface', result.context?.name),
        row('Host', formatProduct(result.context?.host ?? null)),
      ],
    },
    {
      id: 'client',
      title: 'Client',
      rows: [
        row('Kind', humanize(result.client?.kind)),
        row('Name', result.client?.name),
        row('Version', result.client?.version?.raw),
      ],
    },
    {
      id: 'engine',
      title: 'Engine',
      rows: [row('Name', result.engine?.name), row('Version', result.engine?.version?.raw)],
    },
    {
      id: 'os',
      title: 'Operating System',
      rows: [row('Name', result.os?.name), row('Version', result.os?.version?.raw)],
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
        row('Architecture', humanize(result.cpu?.architecture)),
        row('Bitness', result.cpu?.bitness ? `${result.cpu.bitness}-bit` : null),
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
    return `import { detectCurrent } from 'ua-info/browser';\n\nconst result = await detectCurrent();`;
  }
  if (input.hasClientHints) {
    return (
      `import { parseRequest } from 'ua-info/server';\n\n` +
      `const result = parseRequest({\n` +
      `  userAgent: ${JSON.stringify(input.userAgent)},\n` +
      `  headers: clientHints,\n` +
      `});`
    );
  }
  return (
    `import { parse } from 'ua-info';\n\n` +
    `const result = parse(${JSON.stringify(input.userAgent)});`
  );
}
