import { parse } from '../index';
import { assertDetectionFixture } from './fixture-assertions';
import { MALFORMED_FIXTURES } from './fixtures';

describe('v2 parser robustness', () => {
    it.each(MALFORMED_FIXTURES)('$id', (fixture) => {
        expect(() => assertDetectionFixture(fixture)).not.toThrow();
    });

    it('is deterministic and returns independent object graphs', () => {
        const userAgent = 'Chrome/150.0.0.0';
        const first = parse(userAgent);
        const second = parse(userAgent);

        expect(first).toEqual(second);
        expect(first).not.toBe(second);
        expect(first.browser).not.toBe(second.browser);
        expect(first.ua).toBe(userAgent);
    });

    it('preserves the exact supplied input', () => {
        const userAgent = '  ExampleClient/1.0\u0000  ';
        expect(parse(userAgent).ua).toBe(userAgent);
    });
});
