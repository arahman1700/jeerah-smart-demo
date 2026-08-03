import { useEffect, useState, type PropsWithChildren } from "react";
import { getRouteMode, type SurfaceMode } from "./app/routeMode";
import { SurfacePortal } from "./app/SurfacePortal";
import { DemoProvider, type DemoProviderProps } from "./data/DemoProvider";
import { JeerahLogo } from "./design/JeerahLogo";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";

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
  const { dir, locale, setLocale, t } = useI18n();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <main role="application" aria-label={t("app.demo")} className="jeerah-root" dir={dir} lang={locale} data-surface={mode}>
      <header className="jeerah-shell-header">
        <JeerahLogo locale={locale} background="dark" />
        <button type="button" onClick={() => setLocale(nextLocale)}>
          {t(nextLocale === "ar" ? "language.arabic" : "language.english")}
        </button>
      </header>
      <section className="jeerah-shell-intro" aria-label={t("app.name")}>
        <p>{t("payment.simulation_notice")}</p>
      </section>
      {children}
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
