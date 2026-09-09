import { BrowserId, ContextId, CPUArchitecture } from './constants';
import { hasChromiumBrand, normalizeArchitecture, normalizePlatform, selectBrowserBrand } from './client-hints';
import type { ClientHints, DetectionInput, RuntimeEvidence } from './input';
import type { BrowserInfo, CPUInfo, DeviceInfo, OSInfo, UAInfo } from './types';
import { parseVersion } from './version';

function canReplaceBrowser(base: BrowserInfo['name'], candidate: BrowserInfo['name']): boolean {
  if (base === null || base === candidate) return true;
  return base === BrowserId.Chrome || base === BrowserId.Chromium;
}

function mergeBrowser(base: BrowserInfo, hints: ClientHints): BrowserInfo {
  const selected = selectBrowserBrand(hints.brands);
  if (selected && canReplaceBrowser(base.name, selected.name)) {
    return {
      ...base,
      name: selected.name,
      family: 'chromium',
      version: selected.version ? parseVersion(selected.version) : selected.name === base.name ? base.version : null,
    };
  }

  const chromium = hints.brands.find((item) => item.brand.toLowerCase() === 'chromium');
  if (base.name === BrowserId.Chromium && chromium) {
    return { ...base, family: 'chromium', version: parseVersion(chromium.version) };
  }

  if (hasChromiumBrand(hints.brands) && base.family === null) {
    return { ...base, family: 'chromium' };
  }
  return base;
}

function mergeOS(base: OSInfo, hints: ClientHints): OSInfo {
  const name = normalizePlatform(hints.platform);
  if (!name) return base;
  return {
    name,
    version: hints.platformVersion ? parseVersion(hints.platformVersion) : base.name === name ? base.version : null,
  };
}

function mergeDevice(base: DeviceInfo, hints: ClientHints): DeviceInfo {
  let type = base.type;
  if (hints.mobile === true) type = 'mobile';

  return {
    type,
    vendor: base.vendor,
    model: hints.model?.trim() ? hints.model.trim() : base.model,
  };
}

function mergeCPU(base: CPUInfo, hints: ClientHints): CPUInfo {
  const architecture = normalizeArchitecture(hints.architecture, hints.bitness);
  if (architecture) {
    const weakerCompatible = architecture.bitness === null && (
      architecture.architecture === base.architecture ||
      (architecture.architecture === CPUArchitecture.ARM && base.architecture === CPUArchitecture.ARM64) ||
      (architecture.architecture === CPUArchitecture.X86 && base.architecture === CPUArchitecture.X86_64)
    );
    if (weakerCompatible) return base;
    return architecture;
  }
  if (hints.bitness !== null) {
    return { ...base, bitness: hints.bitness };
  }
  return base;
}

function mergeRuntime(base: UAInfo, runtime: RuntimeEvidence | null): UAInfo {
  if (!runtime) return base;

  if (runtime.liffInClient === true) {
    const lineVersion = base.context.host?.name === ContextId.Line ? base.context.host.version : null;
    return {
      ...base,
      browser: { ...base.browser, mode: base.browser.mode === 'headless' ? 'headless' : 'webview' },
      context: {
        type: 'mini-app',
        name: ContextId.Liff,
        host: { name: ContextId.Line, version: lineVersion },
      },
    };
  }

  if (runtime.standalonePWA === true && base.context.type === null) {
    return {
      ...base,
      context: { type: 'pwa', name: ContextId.PWA, host: null },
    };
  }

  return base;
}

export function enrich(base: UAInfo, input: DetectionInput): UAInfo {
  const hints = input.clientHints;
  const enriched = hints
    ? {
        ...base,
        browser: mergeBrowser(base.browser, hints),
        os: mergeOS(base.os, hints),
        device: mergeDevice(base.device, hints),
        cpu: mergeCPU(base.cpu, hints),
      }
    : base;
  return mergeRuntime(enriched, input.runtime);
}
