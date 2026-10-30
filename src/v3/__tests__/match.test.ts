import { compileMatcher, pick, strongestVersion, type Candidate, type RowSpec } from '../core/match';
import { scan } from '../core/scan';

type Id = 'generic' | 'special' | 'other' | 'gated';

const ROWS: Readonly<Record<Id, RowSpec<Id>>> = {
  generic: { match: [{ product: 'Base', fallback: true }] },
  special: { match: ['Special'], beats: ['other'] },
  other: { match: ['Other'] },
  gated: { match: [{ product: 'Gated', os: ['android'], versionOptional: true }] },
};

function candidate(id: Id, overrides: Partial<Candidate<Id>> = {}): Candidate<Id> {
  return { id, source: 'ua', version: null, fallback: false, signal: null, ...overrides };
}

const matcher = compileMatcher(ROWS);

describe('matcher', () => {
  it('finds a candidate with its version', () => {
    expect(matcher.find(scan('Special/2.1'), null)).toMatchObject([{ id: 'special', fallback: false, version: { full: '2.1' } }]);
  });

  it('skips a product that has no version unless the signal allows it', () => {
    expect(matcher.find(scan('Special'), null)).toEqual([]);
    expect(matcher.find(scan('Gated'), 'android')).toHaveLength(1);
  });

  it('applies the OS gate', () => {
    expect(matcher.find(scan('Gated'), 'ios')).toEqual([]);
    expect(matcher.find(scan('Gated'), null)).toEqual([]);
  });

  it('lists every product name for the accounted-token set', () => {
    expect([...matcher.productNames()].sort()).toEqual(['base', 'gated', 'other', 'special']);
  });

  it('follows beats transitively and ignores cycles', () => {
    const chain = compileMatcher<'a' | 'b' | 'c', unknown>({
      a: { match: ['A'], beats: ['b'] },
      b: { match: ['B'], beats: ['c', 'a'] },
      c: { match: ['C'] },
    });

    expect(chain.beats('a', 'c')).toBe(true);
    expect(chain.beats('c', 'a')).toBe(false);
  });
});

describe('pick', () => {
  const beats = matcher.beats;

  it('prefers a specific candidate over a fallback one', () => {
    expect(pick([candidate('generic', { fallback: true }), candidate('special')], beats).id).toBe('special');
  });

  it('uses the fallback candidates when nothing is specific', () => {
    expect(pick([candidate('generic', { fallback: true })], beats).id).toBe('generic');
  });

  it('lets a row beat the rows it lists', () => {
    expect(pick([candidate('other'), candidate('special')], beats).id).toBe('special');
  });

  it('prefers the stronger source when ids conflict', () => {
    expect(pick([candidate('gated'), candidate('other', { source: 'hints' })], beats).id).toBe('other');
  });

  it('returns no id for an unresolved conflict and keeps the survivors', () => {
    const result = pick([candidate('gated'), candidate('other')], beats);

    expect(result.id).toBeNull();
    expect(result.survivors.map((item) => item.id).sort()).toEqual(['gated', 'other']);
  });

  it('returns no id without candidates', () => {
    expect(pick([], beats).id).toBeNull();
  });

  it('does not depend on candidate order', () => {
    const all = [
      candidate('generic', { fallback: true }),
      candidate('special'),
      candidate('other'),
      candidate('gated', { source: 'hints' }),
    ];
    const outcomes = new Set<string | null>();
    for (let shift = 0; shift < all.length; shift++) {
      const rotated = [...all.slice(shift), ...all.slice(0, shift)];
      outcomes.add(pick(rotated, beats).id);
      outcomes.add(pick([...rotated].reverse(), beats).id);
    }

    expect([...outcomes]).toHaveLength(1);
  });
});

describe('strongestVersion', () => {
  it('takes the version of the strongest source that has one', () => {
    const version = (full: string) => ({ full, major: Number.parseInt(full, 10) });
    const candidates = [
      candidate('special', { version: version('1.0') }),
      candidate('special', { source: 'hints', version: version('2.0') }),
      candidate('special', { source: 'hints', version: null }),
    ];

    expect(strongestVersion(candidates, 'special')).toEqual(version('2.0'));
    expect(strongestVersion(candidates, 'other')).toBeNull();
  });
});
