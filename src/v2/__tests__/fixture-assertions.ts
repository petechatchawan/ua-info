import { parse } from '../index';
import type { DetectionFixture } from './fixtures';

export function assertDetectionFixture(fixture: DetectionFixture): void {
    expect(parse(fixture.userAgent)).toMatchObject(fixture.expected);
}
