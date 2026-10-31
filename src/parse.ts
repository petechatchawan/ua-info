import { resolve } from './core/resolve';
import type { UAInfo } from './types';

export function parse(userAgent: string): UAInfo {
  return resolve(typeof userAgent === 'string' ? userAgent : '', null, null);
}
