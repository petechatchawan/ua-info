import type { ClientHints } from './input';
import type { DeviceInfo } from './types';

export function mergeDevice(base: DeviceInfo, hints: ClientHints): DeviceInfo {
  let type = base.type;
  if (hints.mobile === true) type = 'mobile';

  return {
    type,
    vendor: base.vendor,
    model: hints.model?.trim() ? hints.model.trim() : base.model,
  };
}
