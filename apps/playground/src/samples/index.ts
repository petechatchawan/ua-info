import { APPLICATION_SAMPLES } from './application-samples';
import { AUTOMATION_SAMPLES } from './automation-samples';
import { BROWSER_SAMPLES } from './browser-samples';
import type { SampleCategory, UserAgentSample } from './sample-types';
import { WEBVIEW_SAMPLES } from './webview-samples';

export type { SampleCategory, UserAgentSample } from './sample-types';

export const SAMPLE_CATEGORIES: readonly SampleCategory[] = Object.freeze([
  'Desktop browsers',
  'Mobile browsers',
  'WebViews',
  'Applications and mini-apps',
  'Automation and bots',
  'HTTP clients',
  'Unknown or malformed',
]);

export const USER_AGENT_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  ...BROWSER_SAMPLES,
  ...WEBVIEW_SAMPLES,
  ...APPLICATION_SAMPLES,
  ...AUTOMATION_SAMPLES,
]);

export function findUserAgentSample(id: string): UserAgentSample | null {
  return USER_AGENT_SAMPLES.find((sample) => sample.id === id) ?? null;
}
