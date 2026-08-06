import { CalendarCheck } from "@phosphor-icons/react";
import { useState } from "react";
import { useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { buildingAmenities, residentBookings } from "../../domain/residentView";
import { amenityIcon } from "../../design/serviceIconMap";
import { BrandIcon } from "../../design/BrandIcon";
import { useI18n } from "../../i18n/I18nProvider";
import { amenityBookingStatusMessageKey } from "../../i18n/messages";
import { ResidentPage } from "../components/ResidentPage";
import { LiveMessage, ServiceImage, useDemoMutation } from "../components/ServiceBits";

/** The building's amenity catalog with real slot capacity and conflict handling. */
export function AmenitiesPage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const { message, setMessage, run } = useDemoMutation();
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [created, setCreated] = useState(false);

  const amenities = buildingAmenities(state);
  const bookings = residentBookings(state);

  const takenCount = (amenityId: string, startsAt: string) =>
    state.amenityBookings.filter((item) => item.amenityId === amenityId && item.startsAt === startsAt && item.status !== "cancelled").length;

  async function book(amenityId: string) {
    const startsAt = slots[amenityId];
    if (!startsAt) {
      setMessage(t("error.select_slot"));
      return;
    }
    const bookingId = demoId("booking");
    const next = await run({
      type: "amenity-booking/created",
      booking: {
        id: bookingId,
        buildingId: state.currentBuildingId,
        residentId: state.currentResidentId,
        amenityId,
        startsAt,
        status: "upcoming",
      },
    });
    if (!next) return;
    if (next.amenityBookings.some((item) => item.id === bookingId)) {
      setCreated(true);
      return;
    }
    const mine = state.amenityBookings.some((item) => item.residentId === state.currentResidentId && item.amenityId === amenityId && item.startsAt === startsAt && item.status !== "cancelled");
    setMessage(mine ? t("amenity.conflict") : t("amenity.full"));
  }

  return (
    <ResidentPage screen="amenities" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><CalendarCheck weight="duotone" /></span>
        <h1>{t("nav.amenities")}</h1>
        <p className="resident-page-title__intro">{t("amenity.slots")}</p>
      </header>

      <LiveMessage tone="error">{message}</LiveMessage>
      {created ? <LiveMessage>{t("amenity.created")}</LiveMessage> : null}

      {amenities.map((amenity) => (
        <article key={amenity.id} className="resident-card resident-amenity" data-testid={`amenity-${amenity.id}`}>
          <ServiceImage imageId={amenity.imageId} locale={locale} className="resident-amenity__photo" />
          <header className="resident-amenity__header">
            <span className="resident-amenity__glyph" aria-hidden="true">
              <BrandIcon icon={amenityIcon(amenity.id)} label={amenity.name[locale]} />
            </span>
            <h2>{amenity.name[locale]}</h2>
          </header>
          <p className="resident-passport__copy">{amenity.description[locale]}</p>
          <p className="resident-eyebrow">{t("amenity.capacity", { count: amenity.capacity })}</p>

          <fieldset className="resident-methods">
            <legend>{t("amenity.slots")}</legend>
            {amenity.slots.map((slot) => {
              const taken = takenCount(amenity.id, slot);
              const full = taken >= amenity.capacity;
              return (
                <label key={slot} className="resident-method" data-selected={slots[amenity.id] === slot ? "true" : "false"}>
                  <input
                    type="radio"
                    name={`slot-${amenity.id}`}
                    value={slot}
                    disabled={full}
                    checked={slots[amenity.id] === slot}
                    onChange={() => setSlots((current) => ({ ...current, [amenity.id]: slot }))}
                  />
                  <span className="resident-method__copy">
                    <strong>{formatDateTime(slot, locale)}</strong>
                    <small>{full ? t("amenity.full") : t("amenity.remaining", { count: amenity.capacity - taken })}</small>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <button
            type="button"
            className="resident-primary-button"
            onClick={() => void book(amenity.id)}
            data-testid={`book-${amenity.id}`}
          >
            {t("action.book_amenity")}
          </button>
        </article>
      ))}

      <section className="resident-section" aria-label={t("amenity.your_bookings")}>
        <h2 className="resident-section__heading">{t("amenity.your_bookings")}</h2>
        {bookings.length ? (
          <ul className="resident-row-list">
            {bookings.map((booking) => {
              const amenity = state.amenities.find((item) => item.id === booking.amenityId);
              return (
                <li key={booking.id} className="resident-card resident-row" data-testid={`booking-${booking.id}`}>
                  <span className="resident-row__copy">
                    <strong>{amenity?.name[locale] ?? t("amenity.title")}</strong>
                    <small>{formatDateTime(booking.startsAt, locale)} · {t(amenityBookingStatusMessageKey[booking.status])}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <p className="resident-card resident-empty">{t("empty.bookings")}</p>}
      </section>
    </ResidentPage>
  );
}
