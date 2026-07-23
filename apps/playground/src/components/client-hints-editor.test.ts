import { describe, expect, it, vi } from 'vitest';
import { createClientHintsEditor } from './client-hints-editor';

describe('createClientHintsEditor', () => {
  it('keeps one details element and emits edits', () => {
    const callbacks = {
      onExpandedChanged: vi.fn(),
      onTextChanged: vi.fn(),
      onReset: vi.fn(),
    };
    const editor = createClientHintsEditor(callbacks);
    const details = editor.element;
    editor.update({ expanded: true, text: '{"x":"y"}', error: null });
    expect(editor.element).toBe(details);
    const textarea = editor.element.querySelector<HTMLTextAreaElement>('textarea')!;
    textarea.value = 'changed';
    textarea.dispatchEvent(new Event('input'));
    expect(callbacks.onTextChanged).toHaveBeenCalledWith('changed');
  });
});
