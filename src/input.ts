export interface BrandVersion {
  readonly brand: string;
  readonly version: string;
}

export interface ClientHints {
  readonly brands: readonly BrandVersion[];
  readonly mobile: boolean | null;
  readonly platform: string | null;
  readonly platformVersion: string | null;
  readonly architecture: string | null;
  readonly bitness: 32 | 64 | null;
  readonly model: string | null;
}

export interface RuntimeEvidence {
  readonly standalonePWA: boolean | null;
  readonly liffInClient: boolean | null;
}

export interface DetectionInput {
  readonly ua: string;
  readonly clientHints: ClientHints | null;
  readonly runtime: RuntimeEvidence | null;
}
