import { describe, expect, it } from 'vitest';
import { parseClientHintsInput } from './client-hints-input';

describe('parseClientHintsInput', () => {
  it('treats blank input as no hints', () => {
    expect(parseClientHintsInput('   ')).toEqual({ ok: true, headers: null });
  });

  it('normalizes valid keys and arrays', () => {
    const result = parseClientHintsInput(
      '{"Sec-CH-UA-Platform":"\\"Android\\"","x-example":["one","two"]}',
    );
    expect(result).toEqual({
      ok: true,
      headers: {
        'sec-ch-ua-platform': '"Android"',
        'x-example': ['one', 'two'],
      },
    });
  });

  it.each(['[]', 'null', '"value"', '42'])('rejects non-object root %s', (text) => {
    const result = parseClientHintsInput(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-root');
  });

  it('rejects malformed JSON', () => {
    const result = parseClientHintsInput('{');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-json');
  });

  it.each(['__proto__', 'prototype', 'constructor'])('rejects key %s', (key) => {
    const result = parseClientHintsInput(`{"${key}":"blocked"}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('dangerous-key');
  });

  it('rejects unsupported values and oversized input', () => {
    const invalid = parseClientHintsInput('{"sec-ch-ua-mobile":true}');
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe('invalid-value');
    const huge = parseClientHintsInput(`{"x":"${'a'.repeat(33_000)}"}`);
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.error.code).toBe('too-large');
  });
});
