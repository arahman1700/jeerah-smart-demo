import { openDB, type IDBPDatabase, type IDBPTransaction } from "idb";
import { createStateChannel, createMemoryStateChannelFactory, type StateChannel, type StateChannelFactory, type SyncMode } from "./channel";
import { createSeedState } from "../domain/fixtures";
import type { DemoAction, DemoState } from "../domain/models";
import { reduceDemoState } from "../domain/reducer";

const STORE_NAME = "demo-state";
const STATE_KEY = "state";

interface PersistedState {
  key: typeof STATE_KEY;
  revision: number;
  value: DemoState;
  updatedAt: string;
}

interface DemoDatabase {
  [STORE_NAME]: {
    key: string;
    value: PersistedState;
  };
}

export interface DemoMeta {
  revision: number;
  storageMode: "indexeddb" | "memory";
  syncMode: SyncMode;
  lastSyncAt: string;
}

export interface RepositorySnapshot {
  state: DemoState;
  meta: DemoMeta;
}

export interface DemoRepository {
  load(): Promise<RepositorySnapshot>;
  dispatch(action: DemoAction): Promise<RepositorySnapshot>;
  reset(): Promise<RepositorySnapshot>;
  subscribe(listener: (snapshot: RepositorySnapshot) => void): () => void;
  close(): void;
}

export interface RepositoryOptions {
  dbName?: string;
  channelName?: string;
  sourceId?: string;
  channelFactory?: StateChannelFactory;
  now?: () => Date;
}

interface InternalOptions extends RepositoryOptions {
  initialState?: DemoState;
  forceMemory?: boolean;
}

const clone = <T,>(value: T): T => structuredClone(value);
const source = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Math.random().toString(36).slice(2)}`;

function createRepository(options: InternalOptions = {}): DemoRepository {
  const now = options.now ?? (() => new Date());
  const dbName = options.dbName ?? "jeerah-demo";
  const sourceId = options.sourceId ?? source();
  const channel: StateChannel = (options.channelFactory ?? createStateChannel)(options.channelName ?? "jeerah-demo", sourceId);
  const initialState = clone(options.initialState ?? createSeedState());
  const listeners = new Set<(snapshot: RepositorySnapshot) => void>();
  let state = clone(initialState);
  let revision = 0;
  let lastSyncAt = now().toISOString();
  let storageMode: DemoMeta["storageMode"] = options.forceMemory ? "memory" : "indexeddb";
  let dbPromise: Promise<IDBPDatabase<DemoDatabase>> | undefined;
  let closed = false;

  const snapshot = (): RepositorySnapshot => ({
    state: clone(state),
    meta: { revision, storageMode, syncMode: channel.syncMode, lastSyncAt },
  });
  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(snapshot());
      } catch {
        // A UI observer cannot invalidate an already committed repository transition.
      }
    });
    try {
      channel.publish({ type: "snapshot-committed", sourceId, revision, state: clone(state) });
    } catch {
      // Synchronization is best-effort after the durable commit has completed.
    }
  };
  const finishCommit = () => {
    const committed = snapshot();
    notify();
    return committed;
  };
  const commitMemory = (transition: (current: DemoState) => DemoState) => {
    state = transition(state);
    revision += 1;
    lastSyncAt = now().toISOString();
    return finishCommit();
  };
  const database = () => {
    if (!dbPromise) {
      if (typeof indexedDB === "undefined") throw new Error("IndexedDB is unavailable");
      dbPromise = openDB<DemoDatabase>(dbName, 1, {
        upgrade(database) {
          if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "key" });
        },
      });
    }
    return dbPromise;
  };
  const commit = async (transition: (current: DemoState) => DemoState): Promise<RepositorySnapshot> => {
    if (storageMode === "memory") return commitMemory(transition);
    let db: IDBPDatabase<DemoDatabase>;
    try {
      db = await database();
    } catch {
      storageMode = "memory";
      return commitMemory(transition);
    }
    let tx: IDBPTransaction<DemoDatabase, [typeof STORE_NAME], "readwrite">;
    let existing: PersistedState | undefined;
    try {
      tx = db.transaction(STORE_NAME, "readwrite");
      existing = await tx.store.get(STATE_KEY);
    } catch {
      storageMode = "memory";
      return commitMemory(transition);
    }
    const nextState = transition(clone(existing ? existing.value : state));
    const nextRevision = (existing?.revision ?? revision) + 1;
    const updatedAt = now().toISOString();
    try {
      await tx.store.put({ key: STATE_KEY, revision: nextRevision, value: nextState, updatedAt });
      await tx.done;
    } catch {
      storageMode = "memory";
      return commitMemory(transition);
    }
    state = nextState;
    revision = nextRevision;
    lastSyncAt = updatedAt;
    return finishCommit();
  };
  const unsubscribeChannel = channel.subscribe((message) => {
    if (closed || message.sourceId === sourceId || message.revision <= revision) return;
    state = clone(message.state);
    revision = message.revision;
    lastSyncAt = now().toISOString();
    listeners.forEach((listener) => {
      try {
        listener(snapshot());
      } catch {
        // A subscriber cannot prevent other observers from receiving a remote snapshot.
      }
    });
  });

  return {
    async load() {
      if (storageMode === "memory") return snapshot();
      try {
        const db = await database();
        const existing = await db.get(STORE_NAME, STATE_KEY);
        if (existing && existing.revision >= revision) {
          state = existing.value;
          revision = existing.revision;
          lastSyncAt = existing.updatedAt;
        }
      } catch {
        storageMode = "memory";
      }
      return snapshot();
    },
    dispatch: (action) => commit((current) => reduceDemoState(current, action)),
    reset: () => commit(() => clone(initialState)),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      if (closed) return;
      closed = true;
      unsubscribeChannel();
      listeners.clear();
      channel.close();
      void dbPromise?.then((db) => db.close(), () => undefined);
    },
  };
}

export function createDemoRepository(options: RepositoryOptions = {}): DemoRepository {
  return createRepository(options);
}

const uiMemoryChannels = createMemoryStateChannelFactory();

export function createMemoryDemoRepository(initialState: DemoState = createSeedState(), channelName = "jeerah-ui-test"): DemoRepository {
  return createRepository({ initialState, channelName, channelFactory: uiMemoryChannels, forceMemory: true });
}
