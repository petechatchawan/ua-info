import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BROWSERS } from '../../src/catalog/browsers';
import { CONTEXTS } from '../../src/catalog/contexts';
import { advertisedIds, missingIds } from '../../scripts/verify/catalog-coverage.mjs';

const README = readFileSync(fileURLToPath(new URL('../../README.md', import.meta.url)), 'utf8');

describe('README catalog coverage', () => {
  it('reads ids from two-column table rows and ignores wider tables', () => {
    const markdown = [
      '| Browser | Id |',
      '| --- | --- |',
      '| Chrome | `chrome` |',
      '| Use case | Import | Main API |',
      '| Parsing | `ua-inspect` | `parse()` |',
    ].join('\n');

    expect(advertisedIds(markdown)).toEqual(['chrome']);
  });

  it('reads the in-app context ids from the dimension row', () => {
    const markdown = '| In-app context | 9 | `line`, `tiktok-lite`, `discord` |';

    expect(advertisedIds(markdown)).toEqual(['line', 'tiktok-lite', 'discord']);
  });

  it('reports an advertised id that the catalog does not provide', () => {
    const markdown = '| Browser | Id |\n| --- | --- |\n| Chrome | `chrome` |\n| Ghost | `ghost-browser` |';

    expect(missingIds(markdown, ['chrome'])).toEqual(['ghost-browser']);
  });

  it('names only ids the shipped catalog contains', () => {
    const known = [...Object.keys(BROWSERS), ...Object.keys(CONTEXTS)];

    expect(missingIds(README, known)).toEqual([]);
    expect(advertisedIds(README)).toEqual(expect.arrayContaining(Object.keys(CONTEXTS)));
  });
});
