import { IdentificationCard, ShieldCheck } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { currentResident, residentPasses } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { visitorPassStatusMessageKey } from "../../i18n/messages";
import { ResidentPage } from "../components/ResidentPage";
import { LiveMessage, useDemoMutation } from "../components/ServiceBits";

/** Fixed fictional guests — the demo never accepts a real visitor identity. */
const GUEST_PRESETS = [
  { id: "guest-1", name: "Mariam Al Noor", label: { ar: "ضيف تجريبي: مريم النور", en: "Demo guest: Mariam Al Noor" } },
  { id: "guest-2", name: "Khaled Rahim", label: { ar: "ضيف تجريبي: خالد رحيم", en: "Demo guest: Khaled Rahim" } },
  { id: "guest-3", name: "Rana Fares", label: { ar: "ضيف تجريبي: رنا فارس", en: "Demo guest: Rana Fares" } },
];

const DAY = 24 * 60 * 60 * 1000;

/** QR content carries a demo flag, the pass ID, and the expiry. Nothing else. */
export function visitorQrValue(pass: { id: string; expiresAt: string }) {
  return JSON.stringify({ demo: true, passId: pass.id, expiresAt: pass.expiresAt });
}

export function VisitorPassPage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const { message, setMessage, run } = useDemoMutation();
  const [presetId, setPresetId] = useState(GUEST_PRESETS[0].id);
  const [created, setCreated] = useState(false);

  const resident = currentResident(state);
  const passes = residentPasses(state)
    .slice()
    .sort((left, right) => Date.parse(right.expiresAt) - Date.parse(left.expiresAt) || left.id.localeCompare(right.id));

  async function createPass() {
    const preset = GUEST_PRESETS.find((item) => item.id === presetId);
    if (!resident || !preset) {
      setMessage(t("error.guest_name_required"));
      return;
    }
    const done = await run({
      type: "visitor-pass/created",
      pass: {
        id: demoId("pass"),
        buildingId: state.currentBuildingId,
        unitId: resident.unitId,
        residentId: resident.id,
        guestName: preset.name,
        expiresAt: new Date(Date.parse(state.now) + DAY).toISOString(),
        status: "active",
      },
    });
    if (done) setCreated(true);
  }

  return (
    <ResidentPage screen="visitor" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><IdentificationCard weight="duotone" /></span>
        <h1>{t("visitor.title")}</h1>
        <p className="resident-page-title__intro">{t("visitor.create_intro")}</p>
      </header>

      <section className="resident-card" aria-label={t("visitor.preset")}>
        <fieldset className="resident-methods">
          <legend>{t("visitor.preset")}</legend>
          {GUEST_PRESETS.map((preset) => (
            <label key={preset.id} className="resident-method" data-selected={presetId === preset.id ? "true" : "false"}>
              <input type="radio" name="guest-preset" value={preset.id} checked={presetId === preset.id} onChange={() => setPresetId(preset.id)} />
              <span className="resident-method__copy"><strong>{preset.label[locale]}</strong></span>
            </label>
          ))}
        </fieldset>

        <p className="resident-notice">
          <ShieldCheck aria-hidden="true" weight="duotone" /> {t("visitor.qr_notice")}
        </p>

        <LiveMessage tone="error">{message}</LiveMessage>
        {created ? <LiveMessage>{t("visitor.created")}</LiveMessage> : null}

        <button type="button" className="resident-primary-button" onClick={() => void createPass()} data-testid="create-visitor-pass">
          {t("action.create_visitor_pass")}
        </button>
      </section>

      <section className="resident-section" aria-label={t("visitor.pass")}>
        <h2 className="resident-section__heading">{t("visitor.pass")}</h2>
        {passes.length ? (
          <div className="resident-row-list">
            {passes.map((pass) => (
              <article key={pass.id} className="resident-card resident-pass" data-testid={`pass-${pass.id}`}>
                <QRCodeSVG
                  value={visitorQrValue(pass)}
                  size={132}
                  role="img"
                  aria-label={t("community.visitor_qr")}
                  title={t("community.visitor_qr")}
                  className="resident-pass__qr"
                />
                <dl className="resident-facts">
                  <div>
                    <dt>{t("visitor.guest")}</dt>
                    <dd>{pass.guestName}</dd>
                  </div>
                  <div>
                    <dt>{t("visitor.expires_at")}</dt>
                    <dd>{formatDateTime(pass.expiresAt, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t("table.status")}</dt>
                    <dd>{t(visitorPassStatusMessageKey[pass.status])}</dd>
                  </div>
                </dl>
                <p className="resident-notice">{t("label.demo_only")}</p>
              </article>
            ))}
          </div>
        ) : <p className="resident-card resident-empty">{t("empty.visitors")}</p>}
      </section>
    </ResidentPage>
  );
}
