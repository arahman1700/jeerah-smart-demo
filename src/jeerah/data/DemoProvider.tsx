import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { DemoAction, DemoState } from "../domain/models";
import { createDemoRepository, type DemoMeta, type DemoRepository } from "./repository";

const DemoStateContext = createContext<DemoState | null>(null);
const DemoMetaContext = createContext<DemoMeta | null>(null);
const DemoDispatchContext = createContext<((action: DemoAction) => Promise<DemoState>) | null>(null);

export interface DemoProviderProps extends PropsWithChildren {
  repository?: DemoRepository;
}

export function DemoProvider({ children, repository: suppliedRepository }: DemoProviderProps) {
  const repository = useMemo(() => suppliedRepository ?? createDemoRepository(), [suppliedRepository]);
  const [snapshot, setSnapshot] = useState(() => ({ state: null as DemoState | null, meta: null as DemoMeta | null }));

  useEffect(() => {
    let active = true;
    void repository.load().then((next) => {
      if (active) setSnapshot(next);
    });
    const unsubscribe = repository.subscribe((next) => setSnapshot(next));
    return () => {
      active = false;
      unsubscribe();
      if (!suppliedRepository) repository.close();
    };
  }, [repository, suppliedRepository]);

  const dispatch = useMemo(() => async (action: DemoAction) => (await repository.dispatch(action)).state, [repository]);
  if (!snapshot.state || !snapshot.meta) return null;
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
