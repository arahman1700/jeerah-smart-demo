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
  window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 0);
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}

export function installObjectUrlAndPrintShims() {
  URL.createObjectURL = () => "blob:jeerah-test";
  URL.revokeObjectURL = () => {};
  window.print = () => {};
}

export function installServiceWorkerShim() {
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
}
