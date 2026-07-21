import type { Version } from './types';

const MAX_VERSION_LENGTH = 128;
const MAX_VERSION_SEGMENTS = 16;
const COMPARATOR_PATTERN = /^\s*(>=|<=|>|<|==|=)?\s*([0-9]+(?:[._,][0-9]+)*)\s*$/;
const VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+)*$/;

function normalizeVersionInput(value: string): string | null {
    const normalized = value.trim().replace(/[_,]/g, '.');

    if (
        normalized.length === 0 ||
        normalized.length > MAX_VERSION_LENGTH ||
        !VERSION_PATTERN.test(normalized)
    ) {
        return null;
    }

    const segments = normalized.split('.');
    return segments.length <= MAX_VERSION_SEGMENTS ? normalized : null;
}

function normalizeSegment(segment: string): string {
    const normalized = segment.replace(/^0+(?=\d)/, '');
    return normalized.length > 0 ? normalized : '0';
}

function parseSegments(value: string): string[] | null {
    const normalized = normalizeVersionInput(value);
    return normalized ? normalized.split('.').map(normalizeSegment) : null;
}

function toSafeNumber(segment: string | undefined): number | null {
    if (segment === undefined) return null;

    const value = Number(segment);
    return Number.isSafeInteger(value) ? value : null;
}

/** Parse a numeric dotted, underscored, or comma-separated product version. */
export function parseVersion(value: string): Version | null {
    const raw = value.trim();
    const segments = parseSegments(raw);

    if (!segments) return null;

    return {
        raw,
        major: toSafeNumber(segments[0]),
        minor: toSafeNumber(segments[1]),
    };
}

/**
 * Compare product versions numerically without assuming Semantic Versioning.
 * Missing segments are treated as zero. Returns null for invalid input.
 */
export function compareVersions(
    left: Version | string | null | undefined,
    right: Version | string | null | undefined,
): -1 | 0 | 1 | null {
    if (left == null || right == null) return null;

    const leftSegments = parseSegments(typeof left === 'string' ? left : left.raw);
    const rightSegments = parseSegments(typeof right === 'string' ? right : right.raw);

    if (!leftSegments || !rightSegments) return null;

    const segmentCount = Math.max(leftSegments.length, rightSegments.length);

    for (let index = 0; index < segmentCount; index++) {
        const leftSegment = leftSegments[index] ?? '0';
        const rightSegment = rightSegments[index] ?? '0';

        if (leftSegment.length !== rightSegment.length) {
            return leftSegment.length > rightSegment.length ? 1 : -1;
        }

        if (leftSegment !== rightSegment) {
            return leftSegment > rightSegment ? 1 : -1;
        }
    }

    return 0;
}

/** Check a product version against one numeric comparator such as `>=120.0`. */
export function satisfiesVersion(
    version: Version | string | null | undefined,
    range: string,
): boolean {
    if (version == null) return false;

    const match = COMPARATOR_PATTERN.exec(range);
    if (!match) return false;

    const operator = match[1] ?? '=';
    const comparison = compareVersions(version, match[2]);
    if (comparison === null) return false;

    switch (operator) {
        case '>':
            return comparison > 0;
        case '>=':
            return comparison >= 0;
        case '<':
            return comparison < 0;
        case '<=':
            return comparison <= 0;
        case '=':
        case '==':
            return comparison === 0;
        default:
            return false;
    }
}
