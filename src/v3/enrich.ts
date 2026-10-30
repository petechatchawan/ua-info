import { CPUArchitecture } from './constants';
import { normalizeArchitecture, normalizePlatform } from './client-hints';
import type { ClientHints } from './input';
import type { CPUInfo, DeviceInfo, OSInfo } from './types';
import { parseVersion } from './version';

export function mergeOS(base: OSInfo, hints: ClientHints): OSInfo {
  const name = normalizePlatform(hints.platform);
  if (!name) return base;
  return {
    name,
    version: hints.platformVersion ? parseVersion(hints.platformVersion) : base.name === name ? base.version : null,
  };
}

export function mergeDevice(base: DeviceInfo, hints: ClientHints): DeviceInfo {
  let type = base.type;
  if (hints.mobile === true) type = 'mobile';

  return {
    type,
    vendor: base.vendor,
    model: hints.model?.trim() ? hints.model.trim() : base.model,
  };
}

export function mergeCPU(base: CPUInfo, hints: ClientHints): CPUInfo {
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
