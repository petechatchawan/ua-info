export interface Component<TModel> {
  readonly element: HTMLElement;
  update(model: TModel): void;
  destroy(): void;
}

export interface Cleanup {
  listen(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  add(dispose: () => void): void;
  destroy(): void;
}

export function createCleanup(): Cleanup {
  const disposers: Array<() => void> = [];
  let destroyed = false;

  return {
    listen(target, type, listener) {
      if (destroyed) return;
      target.addEventListener(type, listener);
      disposers.push(() => target.removeEventListener(type, listener));
    },
    add(dispose) {
      if (destroyed) dispose();
      else disposers.push(dispose);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const dispose of disposers.splice(0).reverse()) dispose();
    },
  };
}
