import { Gift, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { residentGifts } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { neighborGiftStatusMessageKey, neighborRelationshipMessageKey } from "../../i18n/messages";
import { ResidentPage } from "../components/ResidentPage";
import { LiveMessage, useDemoMutation } from "../components/ServiceBits";

const GIFT_SERVICE_ID = "service-neighbor-gifts";

/**
 * Gifting picks from a fixed fictional relationship list. The demo never opens a
 * resident directory and never reveals an apartment number or contact detail.
 */
export function GiftNeighborPage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const keyboard = useKeyboard();
  const { message, setMessage, run } = useDemoMutation();
  const [relationshipId, setRelationshipId] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const gifts = residentGifts(state);

  async function send() {
    if (!relationshipId) {
      setMessage(t("error.select_relationship"));
      return;
    }
    keyboard.hide();
    const created = await run({
      type: "neighbor-gift/sent",
      gift: {
        id: demoId("gift"),
        serviceId: GIFT_SERVICE_ID,
        senderId: state.currentResidentId,
        recipientRelationshipId: relationshipId,
        message: note.trim().slice(0, 120),
        status: "sent",
        createdAt: state.now,
      },
    });
    if (created) {
      setSent(true);
      setNote("");
    }
  }

  return (
    <ResidentPage screen="gift" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><Gift weight="duotone" /></span>
        <h1>{t("gift.title")}</h1>
        <p className="resident-page-title__intro">{t("gift.privacy")}</p>
      </header>

      <section className="resident-card" aria-label={t("gift.relationship")}>
        <fieldset className="resident-methods">
          <legend>{t("gift.relationship")}</legend>
          {state.neighborRelationships.map((relationship) => (
            <label key={relationship.id} className="resident-method" data-selected={relationshipId === relationship.id ? "true" : "false"}>
              <input
                type="radio"
                name="gift-relationship"
                value={relationship.id}
                checked={relationshipId === relationship.id}
                onChange={() => setRelationshipId(relationship.id)}
              />
              <span className="resident-method__copy">
                <strong>{relationship.displayName[locale]}</strong>
                <small>{t(neighborRelationshipMessageKey[relationship.relation])}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="mobile-field" htmlFor="gift-note">
          <span className="field-label">{t("gift.note")}</span>
          <KeyboardInput
            id="gift-note"
            maxLength={120}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>

        <p className="resident-notice">
          <ShieldCheck aria-hidden="true" weight="duotone" /> {t("gift.privacy")}
        </p>

        <LiveMessage tone="error">{message}</LiveMessage>
        {sent ? <LiveMessage>{t("gift.created")}</LiveMessage> : null}

        <button type="button" className="resident-primary-button" onClick={() => void send()} data-testid="send-gift">
          {t("action.send")}
        </button>
      </section>

      <section className="resident-section" aria-label={t("gift.your_gifts")}>
        <h2 className="resident-section__heading">{t("gift.your_gifts")}</h2>
        {gifts.length ? (
          <ul className="resident-row-list">
            {gifts.map((gift) => {
              const relationship = state.neighborRelationships.find((item) => item.id === gift.recipientRelationshipId);
              return (
                <li key={gift.id} className="resident-card resident-row" data-testid={`gift-${gift.id}`}>
                  <span className="resident-row__copy">
                    <strong>{relationship?.displayName[locale] ?? t("relationship.neighbor")}</strong>
                    <small>{t(neighborGiftStatusMessageKey[gift.status])} · {formatDate(gift.createdAt, locale)}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <p className="resident-card resident-empty">{t("empty.title")}</p>}
      </section>
    </ResidentPage>
  );
}
