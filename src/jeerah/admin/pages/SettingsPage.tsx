import { useI18n } from "../../i18n/I18nProvider";
import { ScenarioStudio } from "../components/ScenarioStudio";

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <section className="admin-page">
      <h1>{t("admin.settings")}</h1>
      <section className="admin-card" aria-label={t("admin.language")}>
        <h2>{t("admin.language")}</h2>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => void setLocale(locale === "ar" ? "en" : "ar")}
        >
          {locale === "ar" ? "English" : "العربية"}
        </button>
      </section>
      <ScenarioStudio />
      <section className="admin-card" aria-label={t("label.demo_only")}>
        <h2>{t("admin.about_demo")}</h2>
        <p>{t("admin.demo_disclaimer")}</p>
      </section>
    </section>
  );
}
