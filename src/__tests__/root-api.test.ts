import { readFileSync } from 'node:fs';
import * as root from '../index';
import * as check from '../v3/check';

// @ts-expect-error v3 root no longer exports generic predicates
const removedRootPredicate = root.isBrowser;
// @ts-expect-error v3 removes the UAResult type
type RemovedUAResult = (typeof import('../index'))['UAResult'];

const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('ua-info package root', () => {
  it('keeps the root parser-first', () => {
    const result = root.parse(CHROME_DESKTOP);
    expect(result.browser.name).toBe(root.BrowserId.Chrome);
    expect(result.os.name).toBe(root.OSId.Windows);
    expect(result.device.type).toBe('desktop');
    expect('isBrowser' in root).toBe(false);
    expect(typeof check.isChrome).toBe('function');
  });

  it('exports check, server, and browser as dedicated package subpaths', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports: Record<string, { import?: string; require?: string } | string>;
    };
    expect(packageJson.exports['./check']).toMatchObject({
      import: './dist/esm/v3/check.js',
      require: './dist/cjs/v3/check.js',
    });
    expect(packageJson.exports['./server']).toMatchObject({
      import: './dist/esm/v3/server.js',
      require: './dist/cjs/v3/server.js',
    });
    expect(packageJson.exports['./browser']).toMatchObject({
      import: './dist/esm/v3/browser.js',
      require: './dist/cjs/v3/browser.js',
    });
  });
});

void removedRootPredicate;
function consumeRemovedType(value: RemovedUAResult): void {
  void value;
}
void consumeRemovedType;
