export interface DebounceController {
  schedule(callback: () => void): void;
  flush(): void;
  cancel(): void;
  destroy(): void;
}

export function createDebounce(delayMs: number): DebounceController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: (() => void) | null = null;
  let destroyed = false;

  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  return {
    schedule(callback) {
      if (destroyed) return;
      cancel();
      pending = callback;
      timer = setTimeout(() => {
        const next = pending;
        timer = null;
        pending = null;
        next?.();
      }, delayMs);
    },
    flush() {
      if (destroyed) return;
      const next = pending;
      cancel();
      next?.();
    },
    cancel,
    destroy() {
      destroyed = true;
      cancel();
    },
  };
}
