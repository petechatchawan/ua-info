import { parseVersion } from '../version';

describe('parseVersion', () => {
  it.each([
    ['150.0.7339.80', { full: '150.0.7339.80', major: 150 }],
    ['18', { full: '18', major: 18 }],
    ['preview', { full: 'preview', major: null }],
  ])('normalizes %s', (input, expected) => {
    expect(parseVersion(input)).toEqual(expected);
  });
});
