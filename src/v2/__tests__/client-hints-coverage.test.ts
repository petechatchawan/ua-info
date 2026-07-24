import { assertRequestFixture } from './fixture-assertions';
import { CLIENT_HINT_FIXTURES } from './fixtures';
import { parseRequest } from '../server';

describe('v2 Client Hints coverage', () => {
    it.each(CLIENT_HINT_FIXTURES)('$id', (fixture) => {
        assertRequestFixture(fixture);
    });

    it('does not mutate frozen header input', () => {
        const headers = Object.freeze({
            'sec-ch-ua': '"Google Chrome";v="150"',
            'sec-ch-ua-platform': '"Android"',
        });

        expect(() => parseRequest({ userAgent: '', headers })).not.toThrow();
        expect(headers).toEqual({
            'sec-ch-ua': '"Google Chrome";v="150"',
            'sec-ch-ua-platform': '"Android"',
        });
    });

    it('supports null-prototype header records', () => {
        const headers = Object.assign(Object.create(null) as Record<string, string>, {
            'sec-ch-ua': '"Microsoft Edge";v="150"',
        });

        expect(parseRequest({ userAgent: '', headers }).browser?.id).toBe('edge');
    });
});
