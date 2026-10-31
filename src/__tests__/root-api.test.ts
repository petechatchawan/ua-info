import { readFileSync } from 'node:fs';
import * as check from '../check';
import * as root from '../index';

// @ts-expect-error the root exports no predicates
const removedRootPredicate = root.is;
// @ts-expect-error v4 has no value objects for ids, only types
const removedIdObject = root.BrowserId;
// @ts-expect-error parseVersion is not part of the public API
const removedParseVersion = root.parseVersion;

const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('user-agent-parser-ts package root', () => {
  it('keeps the root parser-first', () => {
    const result = root.parse(CHROME_DESKTOP);
    expect(result.browser.name).toBe('chrome');
    expect(result.os.name).toBe('windows');
    expect(result.device.type).toBe('desktop');
    expect(Object.keys(root)).toEqual(['parse']);
  });

  it('exports exactly is and isBot from check', () => {
    expect(Object.keys(check).sort()).toEqual(['is', 'isBot']);
  });

  it('exports check, server, browser and labels as dedicated package subpaths', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports: Record<string, { import?: string; require?: string; types?: string } | string>;
    };
    for (const name of ['check', 'server', 'browser', 'labels']) {
      expect(packageJson.exports[`./${name}`]).toEqual({
        types: `./dist/esm/${name}.d.ts`,
        import: `./dist/esm/${name}.js`,
        require: `./dist/cjs/${name}.js`,
        default: `./dist/esm/${name}.js`,
      });
    }
  });
});

void removedRootPredicate;
void removedIdObject;
void removedParseVersion;
