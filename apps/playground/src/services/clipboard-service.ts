export interface ClipboardService {
  writeText(value: string): Promise<void>;
}

export function createClipboardService(): ClipboardService {
  return {
    async writeText(value) {
      if (!globalThis.navigator?.clipboard) {
        throw new Error('Clipboard access is unavailable.');
      }
      await globalThis.navigator.clipboard.writeText(value);
    },
  };
}
