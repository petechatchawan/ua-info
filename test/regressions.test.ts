import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Behavioral defects found by the 2026-10-30 multi-model review. Each one must stay pinned by at
// least one corpus entry, open while it is wrong and closed once it is fixed, so that a fix cannot
// be silently re-accepted by regenerating expectations.
//
// Defects 1 to 4 and the matchMedia guard are pinned by src/__tests__/robustness.test.ts and
// browser-runtime.test.ts. Defects 15 to 22 concern structure (hand-synced lists, test strength,
// dead code) and are tracked by docs/superpowers/specs/2026-10-30-v4-catalog-architecture-design.md.
const BEHAVIORAL_DEFECTS = ['#5', '#6', '#7', '#8', '#9', '#10', '#11', '#12', '#13', '#14'];

const CORPUS_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'corpus');

function pinnedDefects(): readonly string[] {
  return readdirSync(CORPUS_DIRECTORY)
    .filter((name) => name.endsWith('.jsonl'))
    .flatMap((file) =>
      readFileSync(path.join(CORPUS_DIRECTORY, file), 'utf8')
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => (JSON.parse(line) as { defect?: string }).defect)
        .filter((defect): defect is string => defect !== undefined),
    );
}

describe('review defects', () => {
  const pinned = pinnedDefects();

  it.each(BEHAVIORAL_DEFECTS)('%s is pinned by a corpus entry', (defect) => {
    expect(pinned).toContain(defect);
  });

  it('does not pin a defect that is missing from the list above', () => {
    expect([...new Set(pinned)].filter((defect) => !BEHAVIORAL_DEFECTS.includes(defect))).toEqual([]);
  });
});
