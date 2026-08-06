import { ArrowCircleRight, QrCode } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoState } from "../../data/DemoProvider";
import { useI18n } from "../../i18n/I18nProvider";
import { Ltr } from "../components/ResidentPage";

const CODE_LENGTH = 6;
/** The only code the demo accepts; shown openly on the screen. */
export const DEMO_JOIN_CODE = "890089";

/** The BLD segmented join-code flow, mirroring the reference journey. */
export function JoinCodePage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const keyboard = useKeyboard();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [result, setResult] = useState<"joined" | "invalid" | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const building = state.buildings.find((item) => item.id === state.currentBuildingId);
  const code = digits.join("");

  const setDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setResult(null);
    if (value && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const submit = () => {
    keyboard.hide();
    setResult(code === DEMO_JOIN_CODE ? "joined" : "invalid");
  };

  return (
    <article className="resident-join" data-testid="join-code-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><QrCode weight="duotone" /></span>
        <h1>{t("join.title")}</h1>
        <p className="resident-page-title__intro">{t("join.intro")}</p>
      </header>

      <section className="resident-card resident-join__code" aria-label={t("join.title")}>
        <div className="resident-join__boxes" dir="ltr">
          <span className="resident-join__prefix" aria-hidden="true">BLD</span>
          {digits.map((digit, index) => (
            <KeyboardInput
              key={index}
              ref={(element: HTMLInputElement | null) => {
                inputs.current[index] = element;
              }}
              className="resident-join__box"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              aria-label={t("join.digit", { position: index + 1 })}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, "").slice(0, 1))}
              onBlur={() => keyboard.hide()}
            />
          ))}
        </div>
        <p className="resident-muted">{t("join.demo_code_hint")} <Ltr>BLD-{DEMO_JOIN_CODE}</Ltr></p>
        <button
          type="button"
          className="resident-primary-button"
          data-testid="join-submit"
          disabled={code.length !== CODE_LENGTH}
          onClick={submit}
        >
          <span aria-hidden="true"><ArrowCircleRight weight="duotone" /></span>
          {t("join.submit")}
        </button>
        {result === "joined" ? (
          <p role="status" className="resident-card resident-join__joined" data-testid="join-success">
            {t("join.already_member", { building: building?.name[locale] ?? "" })}
          </p>
        ) : null}
        {result === "invalid" ? (
          <p role="alert" className="resident-alert" data-testid="join-invalid">{t("join.invalid")}</p>
        ) : null}
      </section>

      <section className="resident-card resident-join__how" aria-label={t("join.how_title")}>
        <h2>{t("join.how_title")}</h2>
        <ol>
          <li><strong>{t("join.step1_title")}</strong> {t("join.step1_body")}</li>
          <li><strong>{t("join.step2_title")}</strong> {t("join.step2_body")}</li>
          <li><strong>{t("join.step3_title")}</strong> {t("join.step3_body")}</li>
        </ol>
      </section>
    </article>
  );
}
