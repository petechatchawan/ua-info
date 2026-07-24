import { assertDetectionFixture } from './fixture-assertions';
import { BROWSER_FIXTURES, CLIENT_FIXTURES } from './fixtures';

describe('v2 detection precedence', () => {
    it.each(BROWSER_FIXTURES)('browser: $id', (fixture) => {
        assertDetectionFixture(fixture);
    });

    it.each(CLIENT_FIXTURES)('client: $id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
