import { openDB } from "idb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStateChannelFactory, createStateChannel, type StateChannel, type StateChannelFactory, type SyncMessage } from "../../src/jeerah/data/channel";
import { createDemoRepository, type DemoRepository, type RepositoryOptions } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";

let sequence = 0;
const databaseNames = new Set<string>();
const repositories = new Set<DemoRepository>();
const nextDatabaseName = () => {
  const name = `jeerah-repository-${sequence++}`;
  databaseNames.add(name);
  return name;
};

const deleteDatabase = (name: string) => new Promise<void>((resolve, reject) => {
  const request = indexedDB.deleteDatabase(name);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error(`Database remained open: ${name}`));
});
const createTestRepository = (options: RepositoryOptions) => {
  const repository = createDemoRepository(options);
  repositories.add(repository);
  return repository;
};

function createControllableChannelFactory() {
  const listeners = new Set<(message: SyncMessage) => void>();
  const factory: StateChannelFactory = () => ({
    syncMode: "memory",
    publish: () => undefined,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => undefined,
  });
  return { factory, deliver: (message: SyncMessage) => listeners.forEach((listener) => listener(message)) };
}

afterEach(async () => {
  repositories.forEach((repository) => repository.close());
  repositories.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await Promise.all([...databaseNames].map(deleteDatabase));
  databaseNames.clear();
});

describe("DemoRepository", () => {
  it("uses fresh v2 default database and channel namespaces", async () => {
    databaseNames.add("jeerah-demo-v2");
    const channelNames: string[] = [];
    const channelFactory: StateChannelFactory = (name) => {
      channelNames.push(name);
      return {
        syncMode: "memory",
        publish: () => undefined,
        subscribe: () => () => undefined,
        close: () => undefined,
      };
    };
    const open = vi.spyOn(indexedDB, "open");
    const remove = vi.spyOn(indexedDB, "deleteDatabase");
    const repository = createTestRepository({ channelFactory });

    const snapshot = await repository.load();

    expect(snapshot.state.schemaVersion).toBe(2);
    expect(channelNames).toEqual(["jeerah-demo-v2"]);
    expect(open).toHaveBeenCalledWith("jeerah-demo-v2", 1);
    expect(open.mock.calls.map(([name]) => name)).toEqual(["jeerah-demo-v2"]);
    expect(remove).not.toHaveBeenCalled();
  });

  it("retains explicit database and channel namespaces", async () => {
    const dbName = nextDatabaseName();
    const channelNames: string[] = [];
    const channelFactory: StateChannelFactory = (name) => {
      channelNames.push(name);
      return {
        syncMode: "memory",
        publish: () => undefined,
        subscribe: () => () => undefined,
        close: () => undefined,
      };
    };
    const open = vi.spyOn(indexedDB, "open");
    const repository = createTestRepository({ dbName, channelName: "explicit-channel", channelFactory });

    await repository.load();

    expect(channelNames).toEqual(["explicit-channel"]);
    expect(open).toHaveBeenCalledWith(dbName, 1);
  });

  it("persists an action and reloads the committed state", async () => {
    const repository = createTestRepository({
      dbName: nextDatabaseName(),
      channelName: "persist",
      channelFactory: createMemoryStateChannelFactory(),
    });

    await repository.reset();
    await repository.dispatch({ type: "locale/set", locale: "en" });

    const snapshot = await repository.load();
    expect(snapshot.state.locale).toBe("en");
    expect(snapshot.meta.storageMode).toBe("indexeddb");
  });

  it("persists through writer close and a fresh repository", async () => {
    const dbName = nextDatabaseName();
    const writer = createTestRepository({ dbName, channelName: "durable", channelFactory: createMemoryStateChannelFactory() });
    const committed = await writer.dispatch({ type: "locale/set", locale: "en" });
    writer.close();
    const reader = createTestRepository({ dbName, channelName: "durable-reader", channelFactory: createMemoryStateChannelFactory() });

    const reloaded = await reader.load();

    expect(reloaded.state.locale).toBe("en");
    expect(reloaded.meta.revision).toBe(committed.meta.revision);
  });

  it("increments revisions when reset replaces a committed state", async () => {
    const repository = createTestRepository({
      dbName: nextDatabaseName(),
      channelName: "reset",
      channelFactory: createMemoryStateChannelFactory(),
    });

    const first = await repository.reset();
    const changed = await repository.dispatch({ type: "locale/set", locale: "en" });
    const reset = await repository.reset();

    expect(reset.meta.revision).toBe(changed.meta.revision + 1);
    expect(reset.meta.revision).toBeGreaterThan(first.meta.revision);
    expect(reset.state.locale).toBe("ar");
    expect(reset.state.schemaVersion).toBe(2);
    expect(reset.state.residents.find((resident) => resident.id === "resident-saif")?.unitId).toBe("unit-89-1204");
  });

  it("notifies another repository instance with the committed snapshot", async () => {
    const channelFactory = createMemoryStateChannelFactory();
    const dbName = nextDatabaseName();
    const first = createTestRepository({ dbName, channelName: "sync", channelFactory });
    const second = createTestRepository({ dbName, channelName: "sync", channelFactory });
    await first.reset();
    await second.load();
    const received = new Promise<string>((resolve) => second.subscribe((snapshot) => resolve(snapshot.state.locale)));

    await first.dispatch({ type: "locale/set", locale: "en" });

    await expect(received).resolves.toBe("en");
  });

  it("uses memory storage when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const repository = createTestRepository({
      channelName: "memory-fallback",
      channelFactory: createMemoryStateChannelFactory(),
    });

    const snapshot = await repository.dispatch({ type: "locale/set", locale: "en" });

    expect(snapshot.state.locale).toBe("en");
    expect(snapshot.meta.storageMode).toBe("memory");
    expect(snapshot.meta.syncMode).toBe("memory");
  });

  it("synchronizes two memory repositories when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const channelFactory = createMemoryStateChannelFactory();
    const first = createTestRepository({ channelName: "memory-sync", channelFactory });
    const second = createTestRepository({ channelName: "memory-sync", channelFactory });
    const received = new Promise<string>((resolve) => second.subscribe((snapshot) => resolve(snapshot.state.locale)));

    await first.dispatch({ type: "locale/set", locale: "en" });

    await expect(received).resolves.toBe("en");
    expect((await second.load()).meta.storageMode).toBe("memory");
  });

  it("ignores self, equal, and stale incoming revisions", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const channel = createControllableChannelFactory();
    const repository = createTestRepository({ sourceId: "self", channelName: "incoming", channelFactory: channel.factory });
    const committed = await repository.dispatch({ type: "locale/set", locale: "en" });
    const remote = { ...createSeedState(), locale: "ar" as const };

    channel.deliver({ type: "snapshot-committed", sourceId: "self", revision: committed.meta.revision + 1, state: remote });
    channel.deliver({ type: "snapshot-committed", sourceId: "remote", revision: committed.meta.revision, state: remote });
    channel.deliver({ type: "snapshot-committed", sourceId: "remote", revision: committed.meta.revision - 1, state: remote });

    const snapshot = await repository.load();
    expect(snapshot.state.locale).toBe("en");
    expect(snapshot.meta.revision).toBe(committed.meta.revision);
  });

  it("isolates notification failures from a committed IndexedDB transition", async () => {
    const dbName = nextDatabaseName();
    const throwingChannel: StateChannelFactory = () => ({
      syncMode: "memory",
      publish: () => { throw new Error("channel unavailable"); },
      subscribe: () => () => undefined,
      close: () => undefined,
    });
    const writer = createTestRepository({ dbName, channelName: "notification-failure", channelFactory: throwingChannel });
    writer.subscribe(() => { throw new Error("subscriber unavailable"); });

    const committed = await writer.dispatch({ type: "locale/set", locale: "en" });
    const reader = createTestRepository({ dbName, channelName: "notification-reader", channelFactory: createMemoryStateChannelFactory() });
    const reloaded = await reader.load();

    expect(committed.state.locale).toBe("en");
    expect(committed.meta.storageMode).toBe("indexeddb");
    expect(committed.meta.revision).toBe(1);
    expect(reloaded.state.locale).toBe("en");
    expect(reloaded.meta.revision).toBe(committed.meta.revision);
  });

  it("stops notifying a closed repository", async () => {
    const channelFactory = createMemoryStateChannelFactory();
    const first = createTestRepository({ channelName: "close", channelFactory });
    const second = createTestRepository({ channelName: "close", channelFactory });
    const received: string[] = [];
    second.subscribe((snapshot) => received.push(snapshot.state.locale));
    second.close();

    await first.dispatch({ type: "locale/set", locale: "en" });

    expect(received).toEqual([]);
  });

  it("stops notifying an unsubscribed listener", async () => {
    const repository = createTestRepository({ channelName: "unsubscribe", channelFactory: createMemoryStateChannelFactory() });
    const received: string[] = [];
    const unsubscribe = repository.subscribe((snapshot) => received.push(snapshot.state.locale));
    unsubscribe();

    await repository.dispatch({ type: "locale/set", locale: "en" });

    expect(received).toEqual([]);
  });
});

describe("state channel selection", () => {
  it("selects BroadcastChannel, then localStorage, then same-realm memory", () => {
    class FakeBroadcastChannel {
      constructor(readonly name: string) {}
      postMessage() {}
      addEventListener() {}
      removeEventListener() {}
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const broadcast = createStateChannel("selection-broadcast", "source");
    expect(broadcast.syncMode).toBe("broadcast");
    broadcast.close();

    vi.stubGlobal("BroadcastChannel", undefined);
    vi.stubGlobal("localStorage", { setItem: () => undefined, removeItem: () => undefined });
    const storage = createStateChannel("selection-storage", "source");
    expect(storage.syncMode).toBe("storage");
    storage.close();

    vi.stubGlobal("localStorage", { setItem: () => { throw new Error("storage denied"); }, removeItem: () => undefined });
    const memory = createStateChannel("selection-memory", "source");
    expect(memory.syncMode).toBe("memory");
    memory.close();
  });
});

describe("stale persisted state hydration", () => {
  it("replaces an incompatible persisted snapshot with a fresh seed that keeps the locale", async () => {
    const dbName = `jeerah-stale-${Math.random().toString(36).slice(2)}`;
    const stale = { schemaVersion: 2, locale: "en", buildings: [], serviceOfferings: [{ id: "old" }] };
    const db = await openDB(dbName, 1, {
      upgrade(database) {
        database.createObjectStore("demo-state", { keyPath: "key" });
      },
    });
    await db.put("demo-state", { key: "state", revision: 7, value: stale, updatedAt: "2026-08-03T00:00:00.000Z" });
    db.close();

    const repository = createDemoRepository({ dbName, channelName: `stale-${dbName}` });
    try {
      const { state, meta } = await repository.load();
      expect(meta.storageMode).toBe("indexeddb");
      expect(state.serviceOfferings).toHaveLength(35);
      expect(state.serviceOfferings.every((offering) => typeof offering.name.ar === "string")).toBe(true);
      expect(state.locale).toBe("en");
      expect(meta.revision).toBe(8);
    } finally {
      repository.close();
    }
  });
});
