import type { DeviceType } from '../types';

export type ModelRule = string | { readonly prefix: string; readonly type: DeviceType };

export interface VendorRow {
  /** Display name, until the result carries a stable vendor ID. */
  readonly label: string;
  /** A brand word that may precede the model in a User-Agent (`SAMSUNG SM-G960F`). */
  readonly words: readonly string[];
  /** Literal model prefixes, at least two characters. A catch-all pattern cannot be written here. */
  readonly models: readonly ModelRule[];
}

const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const VENDORS: Readonly<Record<string, VendorRow>> = {
  amazon: { label: 'Amazon', words: ['amazon'], models: [{ prefix: 'AFT', type: 'smart-tv' }, { prefix: 'KF', type: 'tablet' }] },
  google: { label: 'Google', words: ['google'], models: ['Pixel', 'Nexus'] },
  huawei: {
    label: 'Huawei',
    words: ['huawei'],
    models: ['HUAWEI', 'ALN-', 'ALT-', 'ANE-', 'BRA-', 'CET-', 'ELE-', 'ELS-', 'JAD-', 'LIO-', 'NOH-', 'OCE-', 'PAL-', 'VOG-'],
  },
  motorola: { label: 'Motorola', words: ['motorola'], models: ['moto', ...digits.map((digit) => `XT${digit}`)] },
  oneplus: { label: 'OnePlus', words: ['oneplus'], models: ['ONEPLUS', 'IN2', 'KB2', 'LE2', 'NE2'] },
  oppo: { label: 'Oppo', words: ['oppo'], models: ['CPH', 'OPPO'] },
  realme: { label: 'Realme', words: ['realme'], models: ['RMX'] },
  samsung: { label: 'Samsung', words: ['samsung'], models: ['SM-', 'GT-', 'SCH-', 'SGH-'] },
  sony: { label: 'Sony', words: ['sony'], models: [{ prefix: 'BRAVIA', type: 'smart-tv' }] },
  vivo: { label: 'Vivo', words: ['vivo'], models: ['vivo', 'V1', 'V2'] },
  xiaomi: { label: 'Xiaomi', words: ['xiaomi'], models: ['MI ', 'MIX ', 'Redmi', 'POCO'] },
};
