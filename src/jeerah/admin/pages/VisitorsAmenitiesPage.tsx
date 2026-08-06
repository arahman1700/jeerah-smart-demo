import { useState } from "react";
import { useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { amenityBookingStatusMessageKey, visitorPassStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { DataTable } from "../components/DataTable";

export function VisitorsAmenitiesPage() {
  const state = useDemoState();
  const { t, locale } = useI18n();
  const [passFilter, setPassFilter] = useState<"all" | "active" | "expired">("all");
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "past">("all");

  const passes = state.visitorPasses
    .filter((pass) => (passFilter === "all" ? true : passFilter === "active" ? pass.status === "active" : pass.status !== "active"))
    .sort((a, b) => b.expiresAt.localeCompare(a.expiresAt) || a.id.localeCompare(b.id));

  const bookings = state.amenityBookings
    .filter((booking) =>
      bookingFilter === "all" ? true : bookingFilter === "upcoming" ? booking.status === "upcoming" : booking.status !== "upcoming",
    )
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <h1>{t("admin.visitors_amenities")}</h1>

      <section className="admin-card" aria-label={t("nav.visitors")}>
        <div className="admin-page__header">
          <h2>{t("nav.visitors")}</h2>
          <label className="admin-field admin-field--inline">
            <span>{t("admin.status_filter")}</span>
            <select value={passFilter} onChange={(event) => setPassFilter(event.target.value as typeof passFilter)}>
              <option value="all">{t("admin.all_statuses")}</option>
              <option value="active">{t("visitor.active")}</option>
              <option value="expired">{t("visitor.expired")}</option>
            </select>
          </label>
        </div>
        <DataTable
          label={t("nav.visitors")}
          rows={passes}
          empty={<p>{t("empty.visitors")}</p>}
          columns={[
            { key: "guest", header: t("table.guest"), render: (pass) => <strong>{pass.guestName}</strong> },
            {
              key: "unit",
              header: t("table.unit"),
              render: (pass) => state.units.find((unit) => unit.id === pass.unitId)?.label[locale] ?? pass.unitId,
            },
            { key: "expires", header: t("table.expires_at"), render: (pass) => formatDateTime(pass.expiresAt, locale) },
            { key: "status", header: t("table.status"), render: (pass) => t(visitorPassStatusMessageKey[pass.status]) },
          ]}
        />
      </section>

      <section className="admin-card" aria-label={t("nav.amenities")}>
        <div className="admin-page__header">
          <h2>{t("nav.amenities")}</h2>
          <label className="admin-field admin-field--inline">
            <span>{t("admin.status_filter")}</span>
            <select value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value as typeof bookingFilter)}>
              <option value="all">{t("admin.all_statuses")}</option>
              <option value="upcoming">{t("amenity.upcoming")}</option>
              <option value="past">{t("admin.past")}</option>
            </select>
          </label>
        </div>
        <DataTable
          label={t("nav.amenities")}
          rows={bookings}
          empty={<p>{t("empty.amenities")}</p>}
          columns={[
            {
              key: "amenity",
              header: t("table.amenity"),
              render: (booking) => state.amenities.find((amenity) => amenity.id === booking.amenityId)?.name[locale] ?? booking.amenityId,
            },
            { key: "time", header: t("table.booking_time"), render: (booking) => formatDateTime(booking.startsAt, locale) },
            { key: "status", header: t("table.status"), render: (booking) => t(amenityBookingStatusMessageKey[booking.status]) },
          ]}
        />
      </section>
    </section>
  );
}
