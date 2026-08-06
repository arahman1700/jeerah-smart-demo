type Viewport = { width: number; height: number };

let viewport: Viewport = { width: 1024, height: 640 };
const mediaQueries = new Set<MediaQueryListShim>();

class MediaQueryListShim extends EventTarget implements MediaQueryList {
  readonly media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;

  constructor(media: string) {
    super();
    this.media = media;
  }

  get matches() {
    return matchesMediaQuery(this.media);
  }

  addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) {
    this.addEventListener("change", listener as EventListener);
  }

  removeListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) {
    this.removeEventListener("change", listener as EventListener);
  }

  dispatchChange() {
    const event = new Event("change") as MediaQueryListEvent;
    Object.defineProperty(event, "matches", { value: this.matches });
    Object.defineProperty(event, "media", { value: this.media });
    this.dispatchEvent(event);
    this.onchange?.call(this, event);
  }
}

function matchesMediaQuery(query: string) {
  // Tests simulate a regular browser tab, never an installed standalone app.
  if (/display-mode/i.test(query)) return /display-mode:\s*browser/i.test(query);
  const minWidth = query.match(/min-width:\s*(\d+)px/i)?.[1];
  const maxWidth = query.match(/max-width:\s*(\d+)px/i)?.[1];
  return (!minWidth || viewport.width >= Number(minWidth)) && (!maxWidth || viewport.width <= Number(maxWidth));
}

export function setTestViewport(width: number, height: number) {
  viewport = { width, height };
  Object.defineProperties(window, {
    innerWidth: { configurable: true, value: width },
    innerHeight: { configurable: true, value: height },
  });
  mediaQueries.forEach((query) => query.dispatchChange());
  window.dispatchEvent(new Event("resize"));
}

export function installMatchMediaShim() {
  window.matchMedia = (query: string) => {
    const list = new MediaQueryListShim(query);
    mediaQueries.add(list);
    return list;
  };
  setTestViewport(viewport.width, viewport.height);
}

export function installResizeObserverShim(defaultViewport: Viewport) {
  class ResizeObserverShim {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      this.callback([{ contentRect: new DOMRect(0, 0, defaultViewport.width, defaultViewport.height), target } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }

    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", { configurable: true, value: ResizeObserverShim });
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value() {
      return new DOMRect(0, 0, defaultViewport.width, defaultViewport.height);
    },
  });
}

export function installPointerAndScrollShims() {
  Object.defineProperty(window, "PointerEvent", { configurable: true, value: MouseEvent });
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value() {} },
    releasePointerCapture: { configurable: true, value() {} },
    scrollIntoView: { configurable: true, value() {} },
  });
}

export function installAnimationFrameShim() {
  // Capture the environment's window: animation loops (e.g. Motion's frame
  // batcher) can re-enter this shim from a timer that fires after the jsdom
  // global is torn down, where a bare `window` reference throws.
  const environmentWindow = window;
  environmentWindow.requestAnimationFrame = (callback) =>
    environmentWindow.setTimeout(() => {
      if (typeof window === "undefined") return;
      callback(Date.now());
    }, 0);
  environmentWindow.cancelAnimationFrame = (handle) => environmentWindow.clearTimeout(handle);
}

export function installObjectUrlAndPrintShims() {
  URL.createObjectURL = () => "blob:jeerah-test";
  URL.revokeObjectURL = () => {};
  window.print = () => {};
}

export function installServiceWorkerShim() {
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
}

/** jsdom here ships without Web Storage; tests need the browser contract. */
export function installStorageShim() {
  const backing = new Map<string, string>();
  const storage = {
    get length() {
      return backing.size;
    },
    clear: () => backing.clear(),
    getItem: (key: string) => backing.get(key) ?? null,
    key: (index: number) => [...backing.keys()][index] ?? null,
    removeItem: (key: string) => {
      backing.delete(key);
    },
    setItem: (key: string, value: string) => {
      backing.set(key, String(value));
    },
  } satisfies Storage;
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
}
