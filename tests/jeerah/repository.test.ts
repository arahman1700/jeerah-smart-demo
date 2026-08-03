import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStateChannelFactory } from "../../src/jeerah/data/channel";
import { createDemoRepository, type DemoRepository, type RepositoryOptions } from "../../src/jeerah/data/repository";

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

afterEach(async () => {
  repositories.forEach((repository) => repository.close());
  repositories.clear();
  vi.unstubAllGlobals();
  await Promise.all([...databaseNames].map(deleteDatabase));
  databaseNames.clear();
});

describe("DemoRepository", () => {
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
});
