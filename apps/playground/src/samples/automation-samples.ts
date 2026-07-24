import type { UserAgentSample } from './sample-types';

export const AUTOMATION_SAMPLES: readonly UserAgentSample[] = Object.freeze([
  {
    id: 'headless-chrome',
    label: 'Headless Chrome',
    category: 'Automation and bots',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36',
  },
  {
    id: 'googlebot',
    label: 'Googlebot Smartphone',
    category: 'Automation and bots',
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 ' +
      '(compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
  {
    id: 'oai-searchbot',
    label: 'OpenAI OAI-SearchBot',
    category: 'Automation and bots',
    userAgent: 'OAI-SearchBot/1.0',
  },
  {
    id: 'googlebot-image',
    label: 'Googlebot Image',
    category: 'Automation and bots',
    userAgent: 'Googlebot-Image/1.0',
  },
  {
    id: 'google-extended-control-token',
    label: 'Google-Extended control token',
    category: 'Unknown or malformed',
    userAgent: 'Google-Extended',
  },
  {
    id: 'curl',
    label: 'curl',
    category: 'HTTP clients',
    userAgent: 'curl/8.15.0',
  },
  {
    id: 'unknown-client',
    label: 'Unknown or malformed client',
    category: 'Unknown or malformed',
    userAgent: 'indistinct-client ???',
  },
]);
