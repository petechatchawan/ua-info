import { describe, expect, it, vi } from 'vitest';
import { createInitialManualState } from '../app/playground-state';
import { createManualUserAgentPanel } from './manual-user-agent-panel';

describe('createManualUserAgentPanel', () => {
  it('preserves textarea identity and supports keyboard parse', () => {
    const onParseNow = vi.fn();
    const panel = createManualUserAgentPanel({
      onUserAgentChanged: vi.fn(),
      onSampleSelected: vi.fn(),
      onParseNow,
      onReset: vi.fn(),
      onClientHintsExpandedChanged: vi.fn(),
      onClientHintsChanged: vi.fn(),
      onClientHintsReset: vi.fn(),
    });
    const textarea = panel.element.querySelector<HTMLTextAreaElement>('#manual-user-agent')!;
    panel.update({ ...createInitialManualState(), userAgent: 'first' });
    panel.update({ ...createInitialManualState(), userAgent: 'second' });
    expect(panel.element.querySelector('#manual-user-agent')).toBe(textarea);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
    expect(onParseNow).toHaveBeenCalledOnce();
  });
});
