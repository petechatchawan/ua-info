import { assertDetectionFixture } from './fixture-assertions';
import { CONTEXT_FIXTURES } from './fixtures';

describe('v2 context and WebView coverage', () => {
    it.each(CONTEXT_FIXTURES)('$id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
