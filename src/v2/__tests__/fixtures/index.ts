import { BROWSER_FIXTURES } from './browsers';
import type { DetectionFixture } from './fixture-types';

export const ALL_DETECTION_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    ...BROWSER_FIXTURES,
]);

export { BROWSER_FIXTURES } from './browsers';
export { PROVENANCE } from './provenance';
export type {
    DeepPartial,
    DetectionFixture,
    FixtureSource,
    FixtureSourceKind,
    RequestFixture,
} from './fixture-types';
