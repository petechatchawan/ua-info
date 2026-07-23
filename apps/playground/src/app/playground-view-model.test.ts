import { describe, expect, it } from 'vitest';
import { chromeResult, lineLiffResult } from '../tests/fixtures';
import { createCodeExample, createDetectionSummary, createResultCards } from './playground-view-model';

describe('playground view models', () => {
  it('keeps browser mode and context dimensions separate', () => {
    const summary = createDetectionSummary(lineLiffResult);
    expect(summary.browser).toBe('Chrome 150.0.7871.46');
    expect(summary.mode).toBe('WebView');
    expect(summary.contextHost).toBe('LINE 26.11.0');
    expect(summary.contextSurface).toBe('LIFF');
  });

  it('uses Not detected for absent values', () => {
    const result = { ...chromeResult, client: null, context: null, cpu: null };
    const cards = createResultCards(result);
    expect(cards.find((card) => card.id === 'client')?.rows.every((row) => row.value === 'Not detected')).toBe(true);
    expect(cards.find((card) => card.id === 'cpu')?.rows.every((row) => row.value === 'Not detected')).toBe(true);
  });

  it('creates examples for each public entry point', () => {
    expect(createCodeExample({ mode: 'current', userAgent: '', hasClientHints: false })).toContain('ua-info/browser');
    expect(createCodeExample({ mode: 'manual', userAgent: 'ua', hasClientHints: false })).toContain("from 'ua-info'");
    expect(createCodeExample({ mode: 'manual', userAgent: 'ua', hasClientHints: true })).toContain('ua-info/server');
  });
});
