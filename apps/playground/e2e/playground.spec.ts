import { expect, test } from '@playwright/test';

test('detects the current browser without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('./');
  await expect(page.getByTestId('detection-summary')).toBeVisible();
  const json = await page.getByTestId('raw-json').textContent();
  expect(() => JSON.parse(json ?? '')).not.toThrow();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/playground-desktop.png', fullPage: true });
});

test('separates LINE LIFF browser, mode, and context fields', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('tab', { name: 'Manual User-Agent' }).click();
  await page.getByTestId('sample-selector').selectOption('line-liff');
  const summary = page.getByTestId('detection-summary');
  await expect(summary).toBeVisible();
  await expect(summary.locator('[data-field="mode"]')).toHaveText('WebView');
  await expect(summary.locator('[data-field="contextHost"]')).toContainText('LINE');
  await expect(summary.locator('[data-field="contextSurface"]')).toHaveText('LIFF');
  const raw = JSON.parse((await page.getByTestId('raw-json').textContent()) ?? '{}');
  expect(raw.browser.mode).toBe('webview');
  expect(raw.context.name).toBe('LIFF');
  expect(raw.context.host.name).toBe('LINE');
});

test('fits a 320px viewport and makes no third-party request', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'UA Info', exact: false })).toBeVisible();
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBe(true);
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
  await page.screenshot({ path: 'test-results/playground-mobile-320.png', fullPage: true });
});
