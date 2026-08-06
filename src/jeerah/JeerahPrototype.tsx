import { useEffect, useState, type PropsWithChildren } from "react";
import { getRouteMode, type SurfaceMode } from "./app/routeMode";
import { LauncherPage } from "./app/LauncherPage";
import { LoginPage, hasDemoSession } from "./app/LoginPage";
import { SurfacePortal } from "./app/SurfacePortal";
import { ThemeProvider, useJeerahTheme } from "./app/theme";
import { AdminApp } from "./admin/AdminApp";
import { DemoProvider, type DemoProviderProps } from "./data/DemoProvider";
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
  const { resolve, toggle } = useJeerahTheme();
  const [signedIn, setSignedIn] = useState(hasDemoSession);

  let surface = children;
  if (!surface) {
    if (mode === "launcher") {
      surface = <LauncherPage theme={resolve("dark")} onToggleTheme={() => toggle("dark")} />;
    } else if (mode === "admin") {
      surface = (
        <section role="application" aria-label={t("app.demo")} className="jeerah-admin-surface">
          <AdminApp />
        </section>
      );
    } else if (mode === "resident" && !signedIn) {
      surface = <LoginPage theme={resolve("dark")} onSignedIn={() => setSignedIn(true)} />;
    } else {
      surface = <ResidentApp />;
    }
  }

  return (
    <main className="jeerah-root" dir={dir} lang={locale} data-surface={mode}>
      {surface}
    </main>
  );
}

export type JeerahPrototypeProps = Pick<DemoProviderProps, "repository" | "createRepository"> & PropsWithChildren;

export default function JeerahPrototype({ children, repository, createRepository }: JeerahPrototypeProps) {
  const mode = useSurfaceMode();
  const surface = <JeerahShell mode={mode}>{children}</JeerahShell>;

  return (
    <DemoProvider repository={repository} createRepository={createRepository}>
      <I18nProvider>
        <ThemeProvider>{mode === "preview" ? surface : <SurfacePortal mode={mode}>{surface}</SurfacePortal>}</ThemeProvider>
      </I18nProvider>
    </DemoProvider>
  );
}
