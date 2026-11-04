export interface FixtureSource {
  readonly kind: 'official-doc' | 'captured' | 'regression';
  readonly authority: string;
  readonly reference: string;
  readonly observedAt: string;
  readonly notes?: string;
}

export interface BrowserFixture {
  readonly id: string;
  readonly userAgent: string;
  readonly expected: {
    readonly name: string | null;
    readonly family: 'chromium' | 'firefox' | 'safari' | null;
    readonly mode: 'browser' | 'webview' | 'headless' | null;
  };
  readonly source: FixtureSource;
}
