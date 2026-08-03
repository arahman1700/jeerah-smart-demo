import { createPortal } from "react-dom";
import { useLayoutEffect, useMemo, type PropsWithChildren } from "react";
import type { SurfaceMode } from "./routeMode";

type DirectSurfaceMode = Exclude<SurfaceMode, "preview">;

export function SurfacePortal({ mode, children }: PropsWithChildren<{ mode: DirectSurfaceMode }>) {
  const host = useMemo(() => Object.assign(document.createElement("div"), { id: `jeerah-${mode}-surface` }), [mode]);

  useLayoutEffect(() => {
    document.body.dataset.jeerahSurface = mode;
    document.body.append(host);

    return () => {
      delete document.body.dataset.jeerahSurface;
      host.remove();
    };
  }, [host, mode]);

  return createPortal(children, host);
}
