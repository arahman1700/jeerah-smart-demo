import { useEffect, useState, type PropsWithChildren } from "react";
import { getRouteMode, type SurfaceMode } from "./app/routeMode";
import { SurfacePortal } from "./app/SurfacePortal";
import { DemoProvider, type DemoProviderProps } from "./data/DemoProvider";
import { JeerahLogo } from "./design/JeerahLogo";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { ResidentApp } from "./resident/ResidentApp";

function readSurfaceMode(): SurfaceMode {
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches ? "standalone" : "browser";
  return getRouteMode(new URL(window.location.href), displayMode, window.innerWidth);
}

function useSurfaceMode() {
  const [mode, setMode] = useState<SurfaceMode>(readSurfaceMode);

  useEffect(() => {
    const update = () => setMode(readSurfaceMode());
    window.addEventListener("resize", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  return mode;
}

function JeerahShell({ mode, children }: PropsWithChildren<{ mode: SurfaceMode }>) {
  const { dir, locale, t } = useI18n();

  return (
    <main className="jeerah-root" dir={dir} lang={locale} data-surface={mode}>
      {children ?? (mode === "admin" ? (
        <section role="application" aria-label={t("app.demo")} className="jeerah-admin-placeholder">
          <JeerahLogo locale={locale} background="dark" />
          <h1>{t("admin.dashboard")}</h1>
          <p>{t("label.demo_only")}</p>
        </section>
      ) : <ResidentApp />)}
    </main>
  );
}

export type JeerahPrototypeProps = Pick<DemoProviderProps, "repository" | "createRepository"> & PropsWithChildren;

export default function JeerahPrototype({ children, repository, createRepository }: JeerahPrototypeProps) {
  const mode = useSurfaceMode();
  const surface = <JeerahShell mode={mode}>{children}</JeerahShell>;

  return (
    <DemoProvider repository={repository} createRepository={createRepository}>
      <I18nProvider>{mode === "preview" ? surface : <SurfacePortal mode={mode}>{surface}</SurfacePortal>}</I18nProvider>
    </DemoProvider>
  );
}
