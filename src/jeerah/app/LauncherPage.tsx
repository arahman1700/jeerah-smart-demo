import { Buildings, DeviceMobileCamera, DownloadSimple, Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nProvider";
import { JeerahLogo } from "../design/JeerahLogo";
import { PaymentBrand } from "../design/PaymentBrand";
import { useInstallPrompt } from "../pwa/useInstallPrompt";
import type { JeerahTheme } from "./theme";

function surfaceUrl(params: Record<string, string>): string {
  const url = new URL(window.location.href);
  url.search = "";
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

/**
 * The entry hall of the demo: the official identity plus the three doors —
 * the installable mobile app, the framed device preview, and the admin
 * console — with install and theme controls up front.
 */
export function LauncherPage({ theme, onToggleTheme }: { theme: JeerahTheme; onToggleTheme: () => void }) {
  const { locale, setLocale, t } = useI18n();
  const install = useInstallPrompt();

  const options = [
    {
      id: "app",
      icon: DeviceMobileCamera,
      title: t("launcher.app_title"),
      body: t("launcher.app_body"),
      href: surfaceUrl({ surface: "app" }),
      testId: "launcher-app",
    },
    {
      id: "preview",
      icon: Monitor,
      title: t("launcher.preview_title"),
      body: t("launcher.preview_body"),
      href: surfaceUrl({ preview: "1" }),
      testId: "launcher-preview",
    },
    {
      id: "admin",
      icon: Buildings,
      title: t("launcher.admin_title"),
      body: t("launcher.admin_body"),
      href: surfaceUrl({ surface: "admin" }),
      testId: "launcher-admin",
    },
  ];

  return (
    <div className="jeerah-launcher" data-testid="launcher-page">
      <header className="jeerah-launcher__top">
        <button type="button" className="jeerah-launcher__chip" onClick={() => void setLocale(locale === "ar" ? "en" : "ar")}>
          {locale === "ar" ? "English" : "العربية"}
        </button>
        <button
          type="button"
          className="jeerah-launcher__chip"
          data-testid="launcher-theme-toggle"
          aria-label={t(theme === "dark" ? "theme.switch_light" : "theme.switch_dark")}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun aria-hidden="true" weight="duotone" /> : <Moon aria-hidden="true" weight="duotone" />}
          {t(theme === "dark" ? "theme.light" : "theme.dark")}
        </button>
      </header>

      <main className="jeerah-launcher__hero">
        <span className="jeerah-launcher__logo">
          <JeerahLogo locale={locale} background={theme} height={64} />
        </span>
        <h1>{t("launcher.headline")}</h1>
        <p>{t("launcher.subline")}</p>

        {install.canInstall ? (
          <button
            type="button"
            className="jeerah-launcher__install"
            data-testid="launcher-install"
            onClick={() => void install.prompt()}
          >
            <DownloadSimple aria-hidden="true" weight="duotone" />
            {t("launcher.install_cta")}
          </button>
        ) : install.isInstalled ? (
          <p className="jeerah-launcher__installed">{t("install.installed")}</p>
        ) : (
          <p className="jeerah-launcher__hint">{t("launcher.install_hint")}</p>
        )}

        <nav className="jeerah-launcher__options" aria-label={t("launcher.options_label")}>
          {options.map((option) => (
            <a key={option.id} className="jeerah-launcher__option" href={option.href} data-testid={option.testId}>
              <span className="jeerah-launcher__option-icon" aria-hidden="true">
                <option.icon weight="duotone" />
              </span>
              <span className="jeerah-launcher__option-copy">
                <strong>{option.title}</strong>
                <small>{option.body}</small>
              </span>
            </a>
          ))}
        </nav>
      </main>

      <footer className="jeerah-launcher__footer">
        <div className="jeerah-launcher__badges" role="group" aria-label={t("launcher.payment_badges")}>
          <PaymentBrand brand="apple-pay" />
          <PaymentBrand brand="mada" />
          <PaymentBrand brand="visa" />
          <PaymentBrand brand="mastercard" />
        </div>
        <p>{t("launcher.payment_badges")}</p>
        <p>{t("launcher.demo_note")}</p>
      </footer>
    </div>
  );
}
