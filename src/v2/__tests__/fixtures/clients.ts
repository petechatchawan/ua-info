import { PROVENANCE } from './provenance';
import type { DetectionFixture, FixtureSource } from './fixture-types';

const REGRESSION_SOURCE: FixtureSource = Object.freeze({
    kind: 'regression',
    authority: 'ua-info regression suite',
    reference: 'client-precedence-v2.1',
    observedAt: '2026-07-24',
    notes: 'Synthetic collision fixtures that protect explicit-client and false-positive boundaries.',
});

export const CLIENT_FIXTURES: readonly DetectionFixture[] = Object.freeze([
    {
        id: 'openai-oai-searchbot',
        userAgent: 'OAI-SearchBot/1.0',
        expected: { client: { kind: 'crawler', id: 'oai-searchbot', name: 'OAI-SearchBot' } },
        source: PROVENANCE.openAi,
    },
    {
        id: 'openai-gptbot',
        userAgent: 'GPTBot/1.2',
        expected: { client: { kind: 'ai-agent', id: 'gptbot', name: 'GPTBot' } },
        source: PROVENANCE.openAi,
    },
    {
        id: 'openai-oai-adsbot',
        userAgent: 'OAI-AdsBot/1.0',
        expected: { client: { kind: 'crawler', id: 'oai-adsbot', name: 'OAI-AdsBot' } },
        source: PROVENANCE.openAiAds,
    },
    {
        id: 'googlebot-generic',
        userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        expected: { client: { kind: 'crawler', id: 'googlebot' } },
        source: PROVENANCE.google,
    },
    {
        id: 'googlebot-smartphone-with-chrome',
        userAgent:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36 ' +
            '(compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        expected: {
            browser: { id: 'chrome' },
            client: { kind: 'crawler', id: 'googlebot' },
        },
        source: PROVENANCE.google,
    },
    {
        id: 'googlebot-image',
        userAgent: 'Googlebot-Image/1.0',
        expected: { client: { kind: 'crawler', id: 'googlebot-image', name: 'Googlebot Image' } },
        source: PROVENANCE.google,
    },
    {
        id: 'googlebot-video',
        userAgent: 'Googlebot-Video/1.0',
        expected: { client: { kind: 'crawler', id: 'googlebot-video', name: 'Googlebot Video' } },
        source: PROVENANCE.google,
    },
    {
        id: 'google-extended-control-token',
        userAgent: 'Google-Extended',
        expected: { client: null },
        source: PROVENANCE.google,
    },
    {
        id: 'perplexity-user-not-autonomous-crawler',
        userAgent:
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ' +
            'Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
        expected: { client: null },
        source: PROVENANCE.perplexity,
    },
    {
        id: 'explicit-ahrefs-before-generic-bot',
        userAgent: 'AhrefsBot/7.0',
        expected: { client: { kind: 'crawler', id: 'ahrefsbot' } },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'ordinary-bot-substring-is-not-client',
        userAgent: 'RoboticsResearch/1.0',
        expected: { client: null },
        source: REGRESSION_SOURCE,
    },
    {
        id: 'generic-crawler-product',
        userAgent: 'ExampleCrawler/3.4',
        expected: { client: { kind: 'bot', id: 'examplecrawler' } },
        source: REGRESSION_SOURCE,
    },
]);
