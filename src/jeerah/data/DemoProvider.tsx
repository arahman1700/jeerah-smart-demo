import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";
import type { DemoAction, DemoState } from "../domain/models";
import { createDemoRepository, type DemoMeta, type DemoRepository } from "./repository";

const DemoStateContext = createContext<DemoState | null>(null);
const DemoMetaContext = createContext<DemoMeta | null>(null);
const DemoDispatchContext = createContext<((action: DemoAction) => Promise<DemoState>) | null>(null);

export interface DemoProviderProps extends PropsWithChildren {
  repository?: DemoRepository;
  createRepository?: () => DemoRepository;
}

export function DemoProvider({ children, repository: suppliedRepository, createRepository = createDemoRepository }: DemoProviderProps) {
  const [repository, setRepository] = useState<DemoRepository | null>(suppliedRepository ?? null);
  const [snapshot, setSnapshot] = useState<{ state: DemoState | null; meta: DemoMeta | null }>({ state: null, meta: null });

  useEffect(() => {
    const activeRepository = suppliedRepository ?? createRepository();
    let active = true;
    setRepository(activeRepository);
    setSnapshot({ state: null, meta: null });
    void activeRepository.load().then((next) => {
      if (active) setSnapshot(next);
    });
    const unsubscribe = activeRepository.subscribe((next) => {
      if (active) setSnapshot(next);
    });
    return () => {
      active = false;
      unsubscribe();
      if (!suppliedRepository) activeRepository.close();
    };
  }, [suppliedRepository, createRepository]);

  const dispatch = useCallback(async (action: DemoAction) => {
    if (!repository) throw new Error("DemoProvider has not initialized its repository");
    return (await repository.dispatch(action)).state;
  }, [repository]);
  if (!repository || !snapshot.state || !snapshot.meta) return null;
  return <DemoStateContext value={snapshot.state}><DemoMetaContext value={snapshot.meta}><DemoDispatchContext value={dispatch}>{children}</DemoDispatchContext></DemoMetaContext></DemoStateContext>;
}

export function useDemoState() {
  const value = useContext(DemoStateContext);
  if (!value) throw new Error("useDemoState must be used inside DemoProvider");
  return value;
}

export function useDemoMeta() {
  const value = useContext(DemoMetaContext);
  if (!value) throw new Error("useDemoMeta must be used inside DemoProvider");
  return value;
}

export function useDemoDispatch() {
  const value = useContext(DemoDispatchContext);
  if (!value) throw new Error("useDemoDispatch must be used inside DemoProvider");
  return value;
}
