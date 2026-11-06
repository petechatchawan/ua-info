import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../../src/parse';
import { parseRequest } from '../../src/server';
import type { UAInfo } from '../../src/types';

// Real User-Agent strings only. Nothing composed belongs in these files. `user-agents.json` holds
// this project's own captures, and every entry there cites its capture in `src`. The per-dimension
// files under `test/data/<dimension>/` carry no `src`. Adding a vector means adding a row, so the
// corpus grows without touching this runner.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface Vector {
    readonly id: string;
    readonly ua: string;
    readonly headers?: Readonly<Record<string, string>>;
    readonly src?: string;
    readonly note?: string;
    readonly expect: DeepPartial<Omit<UAInfo, 'ua'>>;
}

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const CAPTURES = path.join(DATA, 'user-agents.json');

// `user-agents.json` holds first-party captures. Each subdirectory holds one dimension.
function loadVectors(): Vector[] {
    const files = [CAPTURES];
    for (const entry of readdirSync(DATA, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        for (const file of readdirSync(path.join(DATA, entry.name))) {
            if (file.endsWith('.json')) files.push(path.join(DATA, entry.name, file));
        }
    }
    return files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')) as Vector[]);
}

const VECTORS = loadVectors();
const CAPTURED = JSON.parse(readFileSync(CAPTURES, 'utf8')) as Vector[];

describe('stored User-Agent vectors', () => {
    it('has an entry', () => {
        expect(VECTORS.length).toBeGreaterThan(0);
    });

    it('uses unique ids', () => {
        const ids = VECTORS.map((entry) => entry.id);
        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });

    it('cites the capture of every first-party string', () => {
        const bad = CAPTURED.filter(
            (entry) => !/^observed:\S.*@\d{4}-\d{2}-\d{2}$/.test(entry.src ?? ''),
        );
        expect(bad.map((entry) => entry.id)).toEqual([]);
    });

    it.each(VECTORS.map((entry) => [entry.id, entry] as const))(
        '%s parses as expected',
        (_, entry) => {
            const info = entry.headers
                ? parseRequest({ ...entry.headers, 'user-agent': entry.ua })
                : parse(entry.ua);
            expect(info).toMatchObject({ ua: entry.ua, ...entry.expect });
        },
    );
});
