import { describe, expect, it, vi } from 'vitest';
import { createDetectionSummary } from './detection-summary';
import { createJsonViewer } from './json-viewer';
import { createCodeExample } from './code-example';

describe('result components', () => {
  it('keeps summary dimensions separate', () => {
    const summary = createDetectionSummary();
    summary.update({
      browser: 'Chrome 150',
      mode: 'WebView',
      contextHost: 'LINE 26',
      contextSurface: 'LIFF',
      os: 'Android 16',
      device: 'Mobile',
    });
    expect(summary.element.querySelector('[data-field="mode"]')?.textContent).toBe('WebView');
    expect(summary.element.querySelector('[data-field="contextHost"]')?.textContent).toBe('LINE 26');
    expect(summary.element.querySelector('[data-field="contextSurface"]')?.textContent).toBe('LIFF');
  });

  it('renders hostile JSON as text and copies exact values', () => {
    const copied = vi.fn();
    const viewer = createJsonViewer({ onCopy: copied });
    const hostile = '<img src=x onerror=alert(1)>';
    const json = JSON.stringify({ ua: hostile }, null, 2);
    viewer.update({ json });
    expect(viewer.element.querySelector('img')).toBeNull();
    expect(viewer.element.textContent).toContain(hostile);
    viewer.element.querySelector<HTMLButtonElement>('button')?.click();
    expect(copied).toHaveBeenCalledWith(json);
  });

  it('copies exact API code', () => {
    const copied = vi.fn();
    const example = createCodeExample({ onCopy: copied });
    example.update({ code: "import { parse } from 'ua-info';" });
    example.element.querySelector<HTMLButtonElement>('button')?.click();
    expect(copied).toHaveBeenCalledWith("import { parse } from 'ua-info';");
  });
});
