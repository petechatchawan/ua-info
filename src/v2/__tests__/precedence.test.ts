import { assertDetectionFixture } from './fixture-assertions';
import { BROWSER_FIXTURES } from './fixtures';

describe('v2 detection precedence', () => {
    it.each(BROWSER_FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
