import type { FixtureSource } from './fixture-types';

function official(authority: string, reference: string, notes: string): FixtureSource {
    return Object.freeze({
        kind: 'official-doc',
        authority,
        reference,
        observedAt: '2026-07-24',
        notes,
    });
}

export const PROVENANCE = Object.freeze({
    openAi: official(
        'OpenAI',
        'https://help.openai.com/en/articles/12627856-publishers-and-developers-faq',
        'Documents OAI-SearchBot and GPTBot crawler claims.',
    ),
    openAiAds: official(
        'OpenAI',
        'https://help.openai.com/en/articles/20001243-advertiser-guidance-for-allowing-openai-web-crawlers',
        'Documents the OAI-AdsBot crawler claim.',
    ),
    google: official(
        'Google',
        'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers',
        'Documents Google crawler User-Agent tokens and Google-Extended control-token semantics.',
    ),
    perplexity: official(
        'Perplexity',
        'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
        'Documents PerplexityBot and Perplexity-User semantics.',
    ),
});
