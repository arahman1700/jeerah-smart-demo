import { SignIn } from "@phosphor-icons/react";
import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { JeerahLogo } from "../design/JeerahLogo";
import type { JeerahTheme } from "./theme";

export const DEMO_SESSION_KEY = "jeerah-demo-session";
/** The fictional account printed openly on the sign-in card. */
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin";

export function hasDemoSession(): boolean {
  try {
    return localStorage.getItem(DEMO_SESSION_KEY) === "active";
  } catch {
    return false;
  }
}

/** A fully local sign-in gate for the app surface. Nothing leaves the browser. */
export function LoginPage({ theme, onSignedIn }: { theme: JeerahTheme; onSignedIn: () => void }) {
  const { locale, t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      try {
        localStorage.setItem(DEMO_SESSION_KEY, "active");
      } catch {
        // The session flag is a convenience; the gate still opens.
      }
      onSignedIn();
      return;
    }
    setError(true);
  };

  return (
    <div className="jeerah-login" data-testid="login-page">
      <div className="jeerah-login__card">
        <span className="jeerah-login__logo">
          <JeerahLogo locale={locale} background={theme} height={44} />
        </span>
        <h1>{t("login.title")}</h1>
        <p className="jeerah-login__intro">{t("login.intro")}</p>

        <p className="jeerah-login__demo" data-testid="login-demo-hint">
          {t("login.demo_hint")} <bdi dir="ltr"><code>admin</code> / <code>admin</code></bdi>
        </p>

        <form onSubmit={submit} noValidate>
          <label className="jeerah-login__field" htmlFor="jeerah-login-user">
            <span>{t("login.username")}</span>
            <input
              id="jeerah-login-user"
              autoComplete="off"
              value={username}
              dir="ltr"
              onChange={(event) => {
                setUsername(event.target.value);
                setError(false);
              }}
            />
          </label>
          <label className="jeerah-login__field" htmlFor="jeerah-login-pass">
            <span>{t("login.password")}</span>
            <input
              id="jeerah-login-pass"
              type="password"
              autoComplete="off"
              value={password}
              dir="ltr"
              onChange={(event) => {
                setPassword(event.target.value);
                setError(false);
              }}
            />
          </label>
          {error ? <p role="alert" className="jeerah-login__error">{t("login.invalid")}</p> : null}
          <button type="submit" className="jeerah-login__submit" data-testid="login-submit">
            <SignIn aria-hidden="true" weight="duotone" />
            {t("login.submit")}
          </button>
        </form>

        <a className="jeerah-login__back" href={(() => { const url = new URL(window.location.href); url.search = ""; return url.toString(); })()}>
          {t("login.back_to_launcher")}
        </a>
      </div>
    </div>
  );
}
