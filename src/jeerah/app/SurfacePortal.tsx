import { createPortal } from "react-dom";
import { useLayoutEffect, useState, type PropsWithChildren } from "react";
import type { SurfaceMode } from "./routeMode";

type DirectSurfaceMode = Exclude<SurfaceMode, "preview">;

export function SurfacePortal({ mode, children }: PropsWithChildren<{ mode: DirectSurfaceMode }>) {
  const [host] = useState(() => Object.assign(document.createElement("div"), { id: `jeerah-${mode}-surface` }));

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
