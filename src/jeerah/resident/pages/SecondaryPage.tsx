import { DeviceMobile } from "@phosphor-icons/react";
import { useI18n } from "../../i18n/I18nProvider";
import { ResidentPage } from "../components/ResidentPage";

export type SecondaryScreenId = "install";

/** The install guidance root. Every other root now owns a real journey. */
export function SecondaryPage({ id }: { id: SecondaryScreenId }) {
  const { t } = useI18n();

  return (
    <ResidentPage screen={id} footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><DeviceMobile weight="duotone" /></span>
        <h1>{t("install.title")}</h1>
        <p className="resident-page-title__intro">{t("install.offline")}</p>
      </header>

      <dl className="resident-card resident-facts">
        <div>
          <dt>{t("install.ios")}</dt>
          <dd>{t("install.ios_instruction")}</dd>
        </div>
        <div>
          <dt>{t("install.android")}</dt>
          <dd>{t("install.android_instruction")}</dd>
        </div>
      </dl>
    </ResidentPage>
  );
}
