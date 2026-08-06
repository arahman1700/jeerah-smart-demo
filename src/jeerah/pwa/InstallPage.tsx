import { DeviceMobile, DownloadSimple, Export, House, SquaresFour } from "@phosphor-icons/react";
import { useState } from "react";
import { BrandIcon } from "../design/BrandIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useInstallPrompt, type InstallPlatform } from "./useInstallPrompt";

/**
 * Platform-aware install guidance. iOS never fires beforeinstallprompt, so it
 * always gets the Share → Add to Home Screen walkthrough; Android/desktop get
 * the native prompt when the browser offers one, with menu guidance as the
 * fallback.
 */
export function InstallPage({ platformOverride }: { platformOverride?: InstallPlatform }) {
  const { t } = useI18n();
  const install = useInstallPrompt();
  const platform = platformOverride ?? install.platform;
  const [outcome, setOutcome] = useState<"accepted" | "dismissed" | "unavailable" | null>(null);

  return (
    <article className="resident-install" data-testid="install-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><DeviceMobile weight="duotone" /></span>
        <h1>{t("install.title")}</h1>
      </header>

      {install.isInstalled ? <p className="resident-card">{t("install.installed")}</p> : null}

      {platform === "ios" ? (
        <section className="resident-card resident-install__steps" aria-label={t("install.ios")}>
          <h2>{t("install.ios")}</h2>
          <ol>
            <li>
              <span aria-hidden="true"><BrandIcon icon={Export} label="" /></span>
              {t("install.ios_step_share")}
            </li>
            <li>
              <span aria-hidden="true"><BrandIcon icon={SquaresFour} label="" /></span>
              {t("install.ios_step_add")}
            </li>
            <li>
              <span aria-hidden="true"><BrandIcon icon={House} label="" /></span>
              {t("install.ios_step_open")}
            </li>
          </ol>
        </section>
      ) : (
        <section className="resident-card resident-install__steps" aria-label={t("install.android")}>
          <h2>{t("install.android")}</h2>
          {install.canInstall ? (
            <button
              type="button"
              className="resident-primary-button"
              onClick={async () => setOutcome(await install.prompt())}
            >
              <span aria-hidden="true"><BrandIcon icon={DownloadSimple} label="" /></span>
              {t("install.native_button")}
            </button>
          ) : (
            <p>{t("install.android_instruction")}</p>
          )}
          {outcome === "dismissed" ? <p>{t("install.dismissed")}</p> : null}
          {outcome === "accepted" ? <p>{t("install.installed")}</p> : null}
        </section>
      )}

      <section className="resident-card" aria-label={t("install.offline")}>
        <h2>{t("install.offline_title")}</h2>
        <p>{t("install.offline")}</p>
        <p>{t("install.offline_limits")}</p>
      </section>
    </article>
  );
}
