import { Image as ImageIcon, MapPin, Minus, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { KeyboardInput, KeyboardTextarea, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar, formatTime } from "../../domain/format";
import { demoId } from "../../domain/ids";
import type { DemoAction, RecurringPlan, ServiceFulfillment, ServiceOrder } from "../../domain/models";
import { INITIAL_ORDER_STATUS } from "../../domain/models";
import { ORDER_STATUS_NOTES } from "../../domain/fixtures";
import { currentResident, isSubscriber } from "../../domain/residentView";
import { dealIsOrderable, dealParticipantCount, dealUnitPrice, type ServiceExperience } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { recurringPlanCadenceMessageKey, serviceFulfillmentMessageKey } from "../../i18n/messages";
import { LiveMessage, useDemoMutation } from "./ServiceBits";
import { getResidentAsset } from "./PropertyGallery";
import { Ltr } from "./ResidentPage";

const CADENCES: RecurringPlan["cadence"][] = ["weekly", "monthly", "quarterly", "seasonal"];
const SAMPLE_IMAGE_IDS = ["living-room", "kitchen", "balcony"];
const WINDOW_OFFSETS: Array<[number, string]> = [[1, "10:00"], [1, "16:00"], [2, "10:00"], [3, "10:00"]];

function riyadhDay(iso: string, addDays: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.parse(iso) + addDays * 86_400_000));
}

/** Fixed future demo windows derived from the demo clock, never from wall time. */
export function scheduleWindows(now: string) {
  return WINDOW_OFFSETS.map(([days, hour]) => {
    const startsAt = `${riyadhDay(now, days)}T${hour}:00+03:00`;
    return { id: startsAt, startsAt, endsAt: new Date(Date.parse(startsAt) + 2 * 60 * 60 * 1000).toISOString() };
  });
}

/**
 * One form whose fields are decided by the fulfillment mode: locked address and
 * ETA on demand, a future window when scheduled, cadence for recurring, sample
 * photos and site-visit notes for a quote, and group progress before a group
 * order may exist at all.
 */
export function ServiceModeForm({ experience, initialProviderId, onCreated }: {
  experience: ServiceExperience;
  initialProviderId?: string;
  onCreated: (orderId: string) => void;
}) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const keyboard = useKeyboard();
  const { offline, message, setMessage, run } = useDemoMutation();
  const { service, providers, deal } = experience;

  const [mode, setMode] = useState<ServiceFulfillment>(experience.fulfillment[0]);
  const [providerId, setProviderId] = useState(initialProviderId ?? providers[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [samples, setSamples] = useState<string[]>([SAMPLE_IMAGE_IDS[0]]);
  const [cadence, setCadence] = useState<RecurringPlan["cadence"]>("monthly");
  const windows = useMemo(() => scheduleWindows(state.now), [state.now]);
  const [windowId, setWindowId] = useState(windows[0].id);

  const resident = currentResident(state);
  const unit = state.units.find((item) => item.id === resident?.unitId);
  const building = state.buildings.find((item) => item.id === state.currentBuildingId);
  const subscriber = isSubscriber(state);
  const offer = subscriber ? experience.offers[0] : undefined;
  const joinedDeal = Boolean(deal && resident && deal.participantIds.includes(resident.id));
  const groupReady = Boolean(deal && dealIsOrderable(deal) && joinedDeal);

  const unitPrice = mode === "group" && deal
    ? dealUnitPrice(deal)
    : offer
      ? offer.memberPrice
      : service.price ?? service.startingPrice ?? 0;
  const quantifiable = service.pricingModel === "fixed" || service.pricingModel === "per-unit";
  const effectiveQuantity = quantifiable ? quantity : 1;
  const total = unitPrice * effectiveQuantity;

  const blocked = !providerId || (mode === "group" && !groupReady);

  async function submit() {
    if (!resident || !unit || !building) return;
    if (!providerId) {
      setMessage(t("error.select_provider"));
      return;
    }
    keyboard.hide();
    const status = INITIAL_ORDER_STATUS[mode];
    const occurredAt = state.now;
    const orderId = demoId("order");
    const scheduledAt = windows.find((item) => item.id === windowId)?.startsAt ?? windows[0].startsAt;

    const order: ServiceOrder = {
      id: orderId,
      serviceId: service.id,
      providerId,
      buildingId: building.id,
      unitId: unit.id,
      residentId: resident.id,
      fulfillment: mode,
      status,
      paymentStatus: mode === "quote" ? "pending" : "paid",
      ...(mode === "quote" ? {} : {
        amount: total,
        quantity: effectiveQuantity,
        breakdown: [
          { id: `${orderId}-unit`, label: service.unitLabel ?? { ar: "سعر الخدمة", en: "Service price" }, amount: unitPrice },
          ...(effectiveQuantity > 1 ? [{ id: `${orderId}-qty`, label: { ar: "الكمية", en: "Quantity" }, amount: total - unitPrice }] : []),
        ],
      }),
      ...(mode === "on-demand" ? { etaMinutes: service.etaMinutes ?? 45 } : { scheduledAt }),
      ...(offer && mode !== "group" && mode !== "quote" ? { offerId: offer.id } : {}),
      ...(mode === "group" && deal ? { dealId: deal.id } : {}),
      ...(mode === "quote" && samples.length ? { sampleImageIds: samples } : {}),
      timeline: [{ id: `${orderId}-${status}`, status, occurredAt, note: { ar: ORDER_STATUS_NOTES[status][0], en: ORDER_STATUS_NOTES[status][1] } }],
      createdAt: occurredAt,
      warrantyDays: service.warrantyDays,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    let action: DemoAction = { type: "order/created", order };
    if (mode === "recurring") {
      const plan: RecurringPlan = { id: demoId("plan"), serviceId: service.id, residentId: resident.id, providerId, cadence, nextDate: scheduledAt, active: true, skippedDates: [] };
      action = { type: "recurring/started", plan, order: { ...order, planId: plan.id } };
    }
    if (await run(action)) onCreated(orderId);
  }

  return (
    <section className="resident-card resident-mode-form" aria-label={t("booking.title")}>
      {experience.fulfillment.length > 1 ? (
        <fieldset className="resident-methods">
          <legend>{t("book.mode")}</legend>
          {experience.fulfillment.map((option) => (
            <label key={option} className="resident-method" data-selected={mode === option ? "true" : "false"}>
              <input type="radio" name="fulfillment-mode" value={option} checked={mode === option} onChange={() => setMode(option)} />
              <span className="resident-method__copy"><strong>{t(serviceFulfillmentMessageKey[option])}</strong></span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {providers.length > 1 ? (
        <fieldset className="resident-methods">
          <legend>{t("action.choose_provider")}</legend>
          {providers.map((provider) => (
            <label key={provider.id} className="resident-method" data-selected={providerId === provider.id ? "true" : "false"}>
              <input type="radio" name="provider" value={provider.id} checked={providerId === provider.id} onChange={() => setProviderId(provider.id)} />
              <span className="resident-method__copy">
                <strong>{provider.name[locale]}</strong>
                <small>{t("provider.rating", { rating: provider.rating.toFixed(1), count: provider.reviewCount })}</small>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {mode === "on-demand" ? (
        <div className="resident-mode-form__block">
          <dl className="resident-facts">
            <div>
              <dt><MapPin aria-hidden="true" weight="duotone" />{t("book.address")}</dt>
              <dd>{unit?.label[locale]} · {building?.name[locale]}</dd>
            </div>
          </dl>
          <p className="resident-notice">{t("book.address_locked")}</p>
          <p className="resident-notice" data-testid="book-eta">{t("service.eta", { minutes: service.etaMinutes ?? 45 })} — {t("book.eta_notice")}</p>
        </div>
      ) : null}

      {mode === "scheduled" || mode === "group" ? (
        <fieldset className="resident-methods">
          <legend>{t("book.window")}</legend>
          {windows.map((item) => (
            <label key={item.id} className="resident-method" data-selected={windowId === item.id ? "true" : "false"}>
              <input type="radio" name="window" value={item.id} checked={windowId === item.id} onChange={() => setWindowId(item.id)} />
              <span className="resident-method__copy">
                <strong>{formatDate(item.startsAt, locale)}</strong>
                <small>{formatTime(item.startsAt, locale)} – {formatTime(item.endsAt, locale)}</small>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {mode === "recurring" ? (
        <>
          <fieldset className="resident-methods">
            <legend>{t("book.cadence")}</legend>
            {CADENCES.map((option) => (
              <label key={option} className="resident-method" data-selected={cadence === option ? "true" : "false"}>
                <input type="radio" name="cadence" value={option} checked={cadence === option} onChange={() => setCadence(option)} />
                <span className="resident-method__copy"><strong>{t(recurringPlanCadenceMessageKey[option])}</strong></span>
              </label>
            ))}
          </fieldset>
          <fieldset className="resident-methods">
            <legend>{t("book.next_date")}</legend>
            {windows.map((item) => (
              <label key={item.id} className="resident-method" data-selected={windowId === item.id ? "true" : "false"}>
                <input type="radio" name="next-date" value={item.id} checked={windowId === item.id} onChange={() => setWindowId(item.id)} />
                <span className="resident-method__copy"><strong>{formatDate(item.startsAt, locale)}</strong></span>
              </label>
            ))}
          </fieldset>
        </>
      ) : null}

      {mode === "quote" ? (
        <div className="resident-mode-form__block">
          <fieldset className="resident-methods">
            <legend>{t("book.samples")}</legend>
            {SAMPLE_IMAGE_IDS.map((imageId) => (
              <label key={imageId} className="resident-method" data-selected={samples.includes(imageId) ? "true" : "false"}>
                <input
                  type="checkbox"
                  value={imageId}
                  checked={samples.includes(imageId)}
                  onChange={() => setSamples((current) => current.includes(imageId) ? current.filter((item) => item !== imageId) : [...current, imageId])}
                />
                <span className="resident-method__copy">
                  <strong><ImageIcon aria-hidden="true" weight="duotone" /> {getResidentAsset(imageId)?.alt[locale] ?? imageId}</strong>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="resident-notice">{t("book.samples_notice")}</p>
          <label className="mobile-field" htmlFor="site-visit-notes">
            <span className="field-label">{t("book.site_visit")}</span>
            <KeyboardTextarea
              id="site-visit-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => keyboard.hide()}
            />
          </label>
          <p className="resident-notice" data-testid="quote-notice">{t("book.quote_notice")}</p>
        </div>
      ) : null}

      {mode === "group" && deal ? (
        <div className="resident-mode-form__block">
          <p className="resident-notice" data-testid="group-progress">
            {t("book.group_progress")}: {t("deal.participants_count", { count: dealParticipantCount(deal) })}
          </p>
          {groupReady ? null : <p className="resident-notice">{t("book.group_locked")}</p>}
        </div>
      ) : null}

      {mode !== "quote" ? (
        <>
          {quantifiable ? (
            <div className="resident-quantity" role="group" aria-label={t("book.quantity")}>
              <button type="button" className="resident-secondary-button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={`${t("book.quantity")} −`}>
                <Minus aria-hidden="true" weight="bold" />
              </button>
              <output className="jeerah-numeric" data-testid="book-quantity">{quantity}</output>
              <button type="button" className="resident-secondary-button" onClick={() => setQuantity((value) => Math.min(6, value + 1))} aria-label={`${t("book.quantity")} +`}>
                <Plus aria-hidden="true" weight="bold" />
              </button>
            </div>
          ) : null}

          <dl className="resident-amount-list">
            <div>
              <dt>{t("table.service")}</dt>
              <dd><Ltr>{formatSar(unitPrice, locale)}</Ltr></dd>
            </div>
            {offer ? (
              <div>
                <dt>{t("book.member_saving")}</dt>
                <dd><Ltr>{formatSar((offer.regularPrice - offer.memberPrice) * effectiveQuantity, locale)}</Ltr></dd>
              </div>
            ) : null}
            <div className="resident-amount-list__total">
              <dt>{t("book.total")}</dt>
              <dd><Ltr testId="book-total">{formatSar(total, locale)}</Ltr></dd>
            </div>
          </dl>
        </>
      ) : null}

      {mode !== "quote" ? (
        <label className="mobile-field" htmlFor="order-notes">
          <span className="field-label">{t("book.notes")}</span>
          <KeyboardInput
            id="order-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>
      ) : null}

      {offline ? <p className="resident-notice" data-testid="offline-notice">{t("error.offline")}</p> : null}
      <LiveMessage tone="error">{message}</LiveMessage>

      <button
        type="button"
        className="resident-primary-button"
        onClick={() => void submit()}
        disabled={blocked}
        data-testid="book-submit"
      >
        {mode === "quote" ? t("action.request_quote") : t("action.confirm_booking")}
      </button>
    </section>
  );
}
