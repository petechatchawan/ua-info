import { assertDetectionFixture } from './fixture-assertions';
import { DEVICE_FIXTURES, OPERATING_SYSTEM_FIXTURES } from './fixtures';

describe('v2 platform coverage', () => {
    it.each(OPERATING_SYSTEM_FIXTURES)('os: $id', (fixture) => {
        assertDetectionFixture(fixture);
    });

    it.each(DEVICE_FIXTURES)('device: $id', (fixture) => {
        assertDetectionFixture(fixture);
    });
});
