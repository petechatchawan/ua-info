import type { ClientHintHeaders } from '../services/ua-detection-service';

export type SampleCategory =
  | 'Desktop browsers'
  | 'Mobile browsers'
  | 'WebViews'
  | 'Applications and mini-apps'
  | 'Automation and bots'
  | 'HTTP clients'
  | 'Unknown or malformed';

export interface UserAgentSample {
  readonly id: string;
  readonly label: string;
  readonly category: SampleCategory;
  readonly userAgent: string;
  readonly clientHints?: ClientHintHeaders;
}
