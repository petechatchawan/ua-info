import { BROWSERS } from '../../src/catalog/browsers';
import { CLIENTS } from '../../src/catalog/clients';
import { CONTEXTS } from '../../src/catalog/contexts';
import { CPUS } from '../../src/catalog/cpus';
import { DEVICE_TYPES } from '../../src/catalog/devices';
import { OPERATING_SYSTEMS } from '../../src/catalog/os';
import { VENDORS } from '../../src/catalog/vendors';
import { labels } from '../../src/labels';

const CATALOGS = {
    browsers: BROWSERS,
    clients: CLIENTS,
    contexts: CONTEXTS,
    cpus: CPUS,
    devices: DEVICE_TYPES,
    os: OPERATING_SYSTEMS,
} as const;

describe('catalog references', () => {
    it.each(Object.entries(CATALOGS))('%s: every `beats` entry names a row', (_, rows) => {
        const ids = new Set(Object.keys(rows));
        for (const row of Object.values(rows) as readonly {
            readonly beats?: readonly string[];
        }[]) {
            for (const beaten of row.beats ?? [])
                expect(ids.has(beaten), `unknown beats id ${beaten}`).toBe(true);
        }
    });

    it.each(Object.entries(CATALOGS))('%s: `beats` has no cycle', (_, rows) => {
        const edges = rows as Readonly<Record<string, { readonly beats?: readonly string[] }>>;
        const reaches = (from: string, target: string, seen = new Set<string>()): boolean =>
            (edges[from].beats ?? []).some(
                (next) =>
                    next === target ||
                    (!seen.has(next) && (seen.add(next), reaches(next, target, seen))),
            );
        for (const id of Object.keys(edges))
            expect(reaches(id, id), `${id} beats itself`).toBe(false);
    });

    it('gives each Client Hints brand to exactly one browser', () => {
        const brands = Object.values(BROWSERS).flatMap((row) =>
            row.brands.map((brand) => brand.toLowerCase()),
        );
        expect(brands.filter((brand, index) => brands.indexOf(brand) !== index)).toEqual([]);
    });

    it('gives each Client Hints platform to exactly one OS', () => {
        const platforms = Object.values(OPERATING_SYSTEMS).flatMap((row) =>
            row.platforms.map((value) => value.toLowerCase()),
        );
        expect(platforms.filter((value, index) => platforms.indexOf(value) !== index)).toEqual([]);
    });

    it('keeps every signal key lowercase', () => {
        for (const rows of Object.values(CATALOGS)) {
            for (const row of Object.values(rows) as readonly {
                readonly match: readonly unknown[];
            }[]) {
                for (const match of row.match) {
                    const signal =
                        typeof match === 'string'
                            ? { product: match }
                            : (match as { product?: string; words?: string });
                    const key = signal.words ?? signal.product ?? '';
                    expect(key.length).toBeGreaterThan(0);
                    if (signal.words !== undefined)
                        expect(signal.words).toBe(signal.words.toLowerCase());
                }
            }
        }
    });

    it('names a real vendor wherever a device signal carries one', () => {
        for (const row of Object.values(DEVICE_TYPES)) {
            for (const match of row.match) {
                if (typeof match !== 'string' && 'vendor' in match && match.vendor !== undefined) {
                    expect(Object.keys(VENDORS)).toContain(match.vendor);
                }
            }
        }
    });

    it('allows no vendor model prefix shorter than two characters or shared by two vendors', () => {
        const seen = new Map<string, string>();
        for (const [id, row] of Object.entries(VENDORS)) {
            for (const rule of row.models) {
                const prefix = (typeof rule === 'string' ? rule : rule.prefix).toLowerCase();
                expect(prefix.length).toBeGreaterThanOrEqual(2);
                expect(seen.get(prefix) ?? id, `${prefix} is claimed by two vendors`).toBe(id);
                seen.set(prefix, id);
            }
        }
    });
});

describe('labels', () => {
    it('has a non-empty display name for every id', () => {
        const expected = {
            browser: Object.keys(BROWSERS),
            os: Object.keys(OPERATING_SYSTEMS),
            device: Object.keys(DEVICE_TYPES),
            cpu: Object.keys(CPUS),
            vendor: Object.keys(VENDORS),
            client: Object.keys(CLIENTS),
            engine: ['blink', 'edgehtml', 'gecko', 'presto', 'webkit'],
            context: [...Object.keys(CONTEXTS), 'liff', 'pwa'],
        } as const;
        for (const [kind, ids] of Object.entries(expected)) {
            const table = labels[kind as keyof typeof labels] as Readonly<Record<string, string>>;
            expect(Object.keys(table).sort()).toEqual([...ids].sort());
            for (const id of ids) expect(table[id].length, `${kind}.${id}`).toBeGreaterThan(0);
        }
    });
});
