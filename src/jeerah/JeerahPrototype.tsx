import { useEffect, useState } from "react";
import { getRouteMode, type SurfaceMode } from "./app/routeMode";
import { SurfacePortal } from "./app/SurfacePortal";
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

function JeerahShell({ mode }: { mode: SurfaceMode }) {
  const { dir, locale, setLocale, t } = useI18n();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <main role="application" aria-label="Jeerah Smart demo" className="jeerah-root" dir={dir} lang={locale} data-surface={mode}>
      <header className="jeerah-shell-header">
        <JeerahLogo locale={locale} background="dark" />
        <button type="button" onClick={() => setLocale(nextLocale)}>
          {t(nextLocale === "ar" ? "language.arabic" : "language.english")}
        </button>
      </header>
      <section className="jeerah-shell-intro" aria-label={t("app.name")}>
        <p>{t("payment.simulation_notice")}</p>
      </section>
    </main>
  );
}

export default function JeerahPrototype() {
  const mode = useSurfaceMode();
  const surface = <JeerahShell mode={mode} />;

  return <I18nProvider>{mode === "preview" ? surface : <SurfacePortal mode={mode}>{surface}</SurfacePortal>}</I18nProvider>;
}
