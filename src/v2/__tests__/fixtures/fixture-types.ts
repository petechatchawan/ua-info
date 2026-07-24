import type { HeaderRecord } from '../../parser/client-hints';
import type { UAResult } from '../../types';

export type DeepPartial<T> = T extends readonly unknown[]
    ? T
    : T extends object
      ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type FixtureSourceKind = 'official-doc' | 'captured' | 'regression';

export interface FixtureSource {
    readonly kind: FixtureSourceKind;
    readonly authority: string;
    readonly reference: string;
    readonly observedAt: string;
    readonly notes?: string;
}

export interface DetectionFixture {
    readonly id: string;
    readonly userAgent: string;
    readonly expected: DeepPartial<UAResult>;
    readonly source: FixtureSource;
}

export interface RequestFixture extends DetectionFixture {
    readonly headers: HeaderRecord;
}
