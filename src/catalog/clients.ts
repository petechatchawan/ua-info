import type { RowSpec } from '../core/match';
import type { ClientType } from '../types';

export interface ClientRow extends RowSpec<string> {
  readonly type: ClientType;
}

const required = (product: string) => product;
const optional = (product: string) => ({ product, versionOptional: true as const });

/**
 * Client types, by who the client acts for.
 * - `crawler`: fetches pages autonomously to build a search or preview index.
 * - `ai-crawler`: fetches pages autonomously to train or ground an AI model.
 * - `ai-assistant`: fetches one page because a person asked an assistant to.
 * - `bot`: an automated agent that no row classifies.
 * - `automation`: drives a browser. `http-client` and `library` make raw requests.
 * Each row's key is the client name in the result.
 */
export const CLIENTS: Readonly<Record<string, ClientRow>> = {
  ahrefsbot: { type: 'crawler', match: [required('AhrefsBot')] },
  applebot: { type: 'crawler', match: [required('Applebot')] },
  axios: { type: 'library', match: [required('axios')] },
  bingbot: { type: 'crawler', match: [required('bingbot')] },
  bytespider: { type: 'ai-crawler', match: [{ words: 'bytespider', versionOptional: true }, optional('Bytespider')] },
  ccbot: { type: 'crawler', match: [required('CCBot')] },
  'chatgpt-user': { type: 'ai-assistant', match: [optional('ChatGPT-User')] },
  claudebot: { type: 'ai-crawler', match: [optional('ClaudeBot')] },
  'claude-user': { type: 'ai-assistant', match: [optional('Claude-User')] },
  curl: { type: 'http-client', match: [required('curl')] },
  facebookexternalhit: { type: 'bot', match: [optional('facebookexternalhit')] },
  googlebot: { type: 'crawler', match: [required('Googlebot')] },
  'googlebot-image': { type: 'crawler', match: [required('Googlebot-Image')] },
  'googlebot-video': { type: 'crawler', match: [required('Googlebot-Video')] },
  gptbot: { type: 'ai-crawler', match: [required('GPTBot')] },
  httpie: { type: 'http-client', match: [required('HTTPie')] },
  'oai-adsbot': { type: 'crawler', match: [optional('OAI-AdsBot')] },
  'oai-searchbot': { type: 'crawler', match: [optional('OAI-SearchBot')] },
  okhttp: { type: 'library', match: [required('okhttp')] },
  'perplexity-user': { type: 'ai-assistant', match: [optional('Perplexity-User')] },
  perplexitybot: { type: 'ai-crawler', match: [optional('PerplexityBot')] },
  playwright: { type: 'automation', match: [required('Playwright')] },
  postman: { type: 'http-client', match: [required('PostmanRuntime')] },
  puppeteer: { type: 'automation', match: [required('Puppeteer')] },
  'python-requests': { type: 'library', match: [required('python-requests')] },
  selenium: { type: 'automation', match: [optional('Selenium')] },
  semrushbot: { type: 'crawler', match: [required('SemrushBot')] },
  thunderbird: { type: 'email-client', match: [required('Thunderbird')] },
  vlc: { type: 'media-player', match: [required('VLC')] },
  wget: { type: 'http-client', match: [required('Wget')] },
  yandexbot: { type: 'crawler', match: [optional('YandexBot')] },
};

/** A product whose name ends with one of these is an unclassified bot. */
export const GENERIC_BOT_SUFFIXES: readonly string[] = ['bot', 'spider', 'crawler'];
