import { compareVersions, parseVersion, satisfiesVersion } from '../version';

describe('v2 version utilities', () => {
    describe('parseVersion', () => {
        it('preserves the raw value and exposes stable major/minor fields', () => {
            expect(parseVersion('150.0.7871.46')).toEqual({
                raw: '150.0.7871.46',
                major: 150,
                minor: 0,
            });

            expect(parseVersion('26_11_0')).toEqual({
                raw: '26_11_0',
                major: 26,
                minor: 11,
            });
        });

        it('rejects empty, malformed, and unbounded input', () => {
            expect(parseVersion('')).toBeNull();
            expect(parseVersion('120.beta')).toBeNull();
            expect(parseVersion('1.'.repeat(20) + '1')).toBeNull();
            expect(parseVersion('1'.repeat(129))).toBeNull();
        });

        it('does not expose unsafe numeric convenience values', () => {
            expect(parseVersion('99999999999999999999.1')).toEqual({
                raw: '99999999999999999999.1',
                major: null,
                minor: 1,
            });
        });
    });

    describe('compareVersions', () => {
        it('compares all numeric segments without lexical ordering', () => {
            expect(compareVersions('150.0.7871.46', '150.0.7871.45')).toBe(1);
            expect(compareVersions('9.10', '10.0')).toBe(-1);
            expect(compareVersions('120', '120.0.0')).toBe(0);
        });

        it('supports separators used by product and OS versions', () => {
            expect(compareVersions('17_2', '17.1')).toBe(1);
            expect(compareVersions('17,2', '17.2')).toBe(0);
        });

        it('compares segments larger than Number.MAX_SAFE_INTEGER safely', () => {
            expect(compareVersions('99999999999999999999.1', '99999999999999999998.9')).toBe(1);
        });

        it('returns null for missing or malformed versions', () => {
            expect(compareVersions(null, '1')).toBeNull();
            expect(compareVersions('1.beta', '1')).toBeNull();
        });
    });

    describe('satisfiesVersion', () => {
        const chromeVersion = parseVersion('120.0.6099.109');

        it.each([
            ['>=120', true],
            ['>119.9', true],
            ['<=120.0.6099.109', true],
            ['=120.0.6099.109', true],
            ['==120.0.6099.109', true],
            ['120.0.6099.109', true],
            ['<120', false],
            ['>=121', false],
        ])('evaluates %s', (range, expected) => {
            expect(satisfiesVersion(chromeVersion, range)).toBe(expected);
        });

        it('returns false for null versions and unsupported range syntax', () => {
            expect(satisfiesVersion(null, '>=1')).toBe(false);
            expect(satisfiesVersion(chromeVersion, '^120')).toBe(false);
            expect(satisfiesVersion(chromeVersion, '>=120 <121')).toBe(false);
        });
    });
});
