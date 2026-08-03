import type { DemoState } from "../domain/models";

export type SyncMode = "broadcast" | "storage" | "memory";

export interface SyncMessage {
  type: "snapshot-committed";
  sourceId: string;
  revision: number;
  state: DemoState;
}

export interface StateChannel {
  readonly syncMode: SyncMode;
  publish(message: SyncMessage): void;
  subscribe(listener: (message: SyncMessage) => void): () => void;
  close(): void;
}

export type StateChannelFactory = (name: string, sourceId: string) => StateChannel;

const storageKey = (name: string) => `jeerah-demo-state:${name}`;

function createBroadcastChannel(name: string, sourceId: string): StateChannel {
  const channel = new BroadcastChannel(name);
  return {
    syncMode: "broadcast",
    publish: (message) => channel.postMessage(message),
    subscribe: (listener) => {
      const handler = (event: MessageEvent<SyncMessage>) => {
        if (event.data.sourceId !== sourceId) listener(event.data);
      };
      channel.addEventListener("message", handler);
      return () => channel.removeEventListener("message", handler);
    },
    close: () => channel.close(),
  };
}

function createStorageChannel(name: string, sourceId: string): StateChannel {
  const key = storageKey(name);
  return {
    syncMode: "storage",
    publish: (message) => {
      localStorage.setItem(key, JSON.stringify(message));
      localStorage.removeItem(key);
    },
    subscribe: (listener) => {
      const handler = (event: StorageEvent) => {
        if (event.key !== key || !event.newValue) return;
        const message = JSON.parse(event.newValue) as SyncMessage;
        if (message.sourceId !== sourceId) listener(message);
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    close: () => undefined,
  };
}

/** A factory owns its registry, so tests can isolate deterministic same-realm buses. */
export function createMemoryStateChannelFactory(): StateChannelFactory {
  const buses = new Map<string, Set<(message: SyncMessage) => void>>();
  return (name, sourceId) => {
    const listeners = new Set<(message: SyncMessage) => void>();
    const bus = buses.get(name) ?? new Set<(message: SyncMessage) => void>();
    buses.set(name, bus);
    const receive = (message: SyncMessage) => {
      if (message.sourceId !== sourceId) listeners.forEach((listener) => listener(message));
    };
    bus.add(receive);
    return {
      syncMode: "memory",
      publish: (message) => bus.forEach((listener) => listener(message)),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      close: () => {
        bus.delete(receive);
        listeners.clear();
        if (bus.size === 0) buses.delete(name);
      },
    };
  };
}

const fallbackMemoryFactory = createMemoryStateChannelFactory();

export function createStateChannel(name: string, sourceId: string): StateChannel {
  if (typeof BroadcastChannel !== "undefined") {
    try {
      return createBroadcastChannel(name, sourceId);
    } catch {
      // Continue to the next transport when a restricted browser exposes but cannot open it.
    }
  }
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const probe = `${storageKey(name)}:probe`;
      localStorage.setItem(probe, sourceId);
      localStorage.removeItem(probe);
      return createStorageChannel(name, sourceId);
    }
  } catch {
    // Access to localStorage can be denied in embedded or private contexts.
  }
  return fallbackMemoryFactory(name, sourceId);
}
