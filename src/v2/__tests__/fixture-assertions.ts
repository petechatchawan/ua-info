import { parse } from '../index';
import { parseRequest } from '../server';
import type { DetectionFixture, RequestFixture } from './fixtures';

export function assertDetectionFixture(fixture: DetectionFixture): void {
    expect(parse(fixture.userAgent)).toMatchObject(fixture.expected);
}

export function assertRequestFixture(fixture: RequestFixture): void {
    expect(parseRequest({ userAgent: fixture.userAgent, headers: fixture.headers })).toMatchObject(fixture.expected);
}
