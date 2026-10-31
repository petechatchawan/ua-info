import type { RowSpec } from '../core/match';
import type { ClientType } from '../types';

export interface ClientRow extends RowSpec<string> {
  readonly label: string;
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
const rows = {
  ahrefsbot: { label: 'AhrefsBot', type: 'crawler', match: [required('AhrefsBot')] },
  applebot: { label: 'Applebot', type: 'crawler', match: [required('Applebot')] },
  axios: { label: 'axios', type: 'library', match: [required('axios')] },
  bingbot: { label: 'Bingbot', type: 'crawler', match: [required('bingbot')] },
  bytespider: {
    label: 'Bytespider',
    type: 'ai-crawler',
    match: [{ words: 'bytespider', versionOptional: true }, optional('Bytespider')],
  },
  ccbot: { label: 'CCBot', type: 'crawler', match: [required('CCBot')] },
  'chatgpt-user': { label: 'ChatGPT-User', type: 'ai-assistant', match: [optional('ChatGPT-User')] },
  claudebot: { label: 'ClaudeBot', type: 'ai-crawler', match: [optional('ClaudeBot')] },
  'claude-user': { label: 'Claude-User', type: 'ai-assistant', match: [optional('Claude-User')] },
  curl: { label: 'curl', type: 'http-client', match: [required('curl')] },
  facebookexternalhit: { label: 'Facebook link preview', type: 'bot', match: [optional('facebookexternalhit')] },
  googlebot: { label: 'Googlebot', type: 'crawler', match: [required('Googlebot')] },
  'googlebot-image': { label: 'Googlebot Image', type: 'crawler', match: [required('Googlebot-Image')] },
  'googlebot-video': { label: 'Googlebot Video', type: 'crawler', match: [required('Googlebot-Video')] },
  gptbot: { label: 'GPTBot', type: 'ai-crawler', match: [required('GPTBot')] },
  httpie: { label: 'HTTPie', type: 'http-client', match: [required('HTTPie')] },
  'oai-adsbot': { label: 'OAI-AdsBot', type: 'crawler', match: [optional('OAI-AdsBot')] },
  'oai-searchbot': { label: 'OAI-SearchBot', type: 'crawler', match: [optional('OAI-SearchBot')] },
  okhttp: { label: 'OkHttp', type: 'library', match: [required('okhttp')] },
  'perplexity-user': { label: 'Perplexity-User', type: 'ai-assistant', match: [optional('Perplexity-User')] },
  perplexitybot: { label: 'PerplexityBot', type: 'ai-crawler', match: [optional('PerplexityBot')] },
  playwright: { label: 'Playwright', type: 'automation', match: [required('Playwright')] },
  postman: { label: 'Postman', type: 'http-client', match: [required('PostmanRuntime')] },
  puppeteer: { label: 'Puppeteer', type: 'automation', match: [required('Puppeteer')] },
  'python-requests': { label: 'python-requests', type: 'library', match: [required('python-requests')] },
  selenium: { label: 'Selenium', type: 'automation', match: [optional('Selenium')] },
  semrushbot: { label: 'SemrushBot', type: 'crawler', match: [required('SemrushBot')] },
  thunderbird: { label: 'Thunderbird', type: 'email-client', match: [required('Thunderbird')] },
  vlc: { label: 'VLC', type: 'media-player', match: [required('VLC')] },
  wget: { label: 'Wget', type: 'http-client', match: [required('Wget')] },
  yandexbot: { label: 'YandexBot', type: 'crawler', match: [optional('YandexBot')] },
} as const satisfies Readonly<Record<string, ClientRow>>;

export type ClientId = keyof typeof rows;
export const CLIENTS: Readonly<Record<ClientId, ClientRow>> = rows;

/** A product whose name ends with one of these is an unclassified bot. */
export const GENERIC_BOT_SUFFIXES: readonly string[] = ['bot', 'spider', 'crawler'];
