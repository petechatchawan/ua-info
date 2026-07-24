import { BROWSER_FIXTURES } from './browsers';
import { CLIENT_HINT_FIXTURES } from './client-hints';
import { CLIENT_FIXTURES } from './clients';
import { CONTEXT_FIXTURES } from './contexts';
import { DEVICE_FIXTURES } from './devices';
import type { DetectionFixture } from './fixture-types';
import { OPERATING_SYSTEM_FIXTURES } from './operating-systems';

export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    ...BROWSER_FIXTURES,
    ...CLIENT_FIXTURES,
    ...CONTEXT_FIXTURES,
    ...OPERATING_SYSTEM_FIXTURES,
    ...DEVICE_FIXTURES,
    ...CLIENT_HINT_FIXTURES,
]);

export { BROWSER_FIXTURES } from './browsers';
export { CLIENT_HINT_FIXTURES } from './client-hints';
export { CLIENT_FIXTURES } from './clients';
export { CONTEXT_FIXTURES } from './contexts';
export { DEVICE_FIXTURES } from './devices';
export { OPERATING_SYSTEM_FIXTURES } from './operating-systems';
export { PROVENANCE } from './provenance';
export type {
    DeepPartial,
    DetectionFixture,
    FixtureSource,
    FixtureSourceKind,
    RequestFixture,
} from './fixture-types';
