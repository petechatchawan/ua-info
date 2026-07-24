import { ALL_DETECTION_FIXTURES, PROVENANCE } from './fixtures';

const FIXTURE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('v2 detection fixture contract', () => {
    it('uses globally unique stable fixture ids', () => {
        const ids = ALL_DETECTION_FIXTURES.map((fixture) => fixture.id);

        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(FIXTURE_ID);
    });

    it('provides complete provenance for every fixture', () => {
        for (const fixture of ALL_DETECTION_FIXTURES) {
            expect(fixture.source.authority.trim()).not.toBe('');
            expect(fixture.source.reference.trim()).not.toBe('');
            expect(fixture.source.observedAt).toMatch(ISO_DATE);
            expect(Object.keys(fixture.expected).length).toBeGreaterThan(0);

            if (fixture.source.kind === 'official-doc') {
                expect(() => new URL(fixture.source.reference)).not.toThrow();
                expect(fixture.source.reference.startsWith('https://')).toBe(true);
            }
        }
    });

    it('defines the frozen authoritative source registry', () => {
        expect(PROVENANCE.openAi.reference).toContain('help.openai.com');
        expect(PROVENANCE.google.reference).toContain('developers.google.com');
        expect(PROVENANCE.perplexity.reference).toContain('docs.perplexity.ai');
    });
});
