import { Buildings, CaretRight, FileText, ShoppingBag, UserCircle } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { MobileScroll } from "../../../mobile/MobileScroll";
import { useDemoState } from "../../data/DemoProvider";
import { formatSar } from "../../domain/format";
import { invoiceStatusMessageKey, orderStatusMessageKey, residentRoleMessageKey, unitStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { getResidentScreen } from "../ResidentApp";
import { PropertyGallery } from "../components/PropertyGallery";

export function UnitPage({ unitId, flow }: { unitId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const unit = state.units.find((item) => item.id === unitId);

  if (!unit) {
    return (
      <MobileScroll className="resident-mobile-page">
        <div
          className="resident-page-content resident-page-content--footer-clearance resident-page-content--padded"
          data-testid="resident-page-content"
          data-resident-screen="unit"
        >
          <p className="resident-card resident-empty">{t("empty.units")}</p>
        </div>
      </MobileScroll>
    );
  }

  const building = state.buildings.find((item) => item.id === unit.buildingId);
  const residents = state.residents.filter((resident) => unit.residentIds.includes(resident.id));
  const invoices = state.invoices.filter((invoice) => invoice.unitId === unit.id);
  const orders = state.orders.filter((order) => order.unitId === unit.id);

  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className="resident-page-content resident-page-content--footer-clearance"
        data-testid="resident-page-content"
        data-resident-screen="unit"
      >
        <PropertyGallery imageIds={unit.imageIds} locale={locale} label={t("resident.unit_gallery")} />

        <div className="resident-detail-body">
          <header className="resident-detail-title">
            <p className="resident-eyebrow">{t("property.unit")}</p>
            <h1>{unit.label[locale]}</h1>
            {building ? (
              <p className="resident-detail-title__meta">
                <Buildings aria-hidden="true" weight="duotone" /> {building.name[locale]}
              </p>
            ) : null}
          </header>

          <ul className="resident-chips">
            <li className="jeerah-numeric">{t("resident.floor", { floor: unit.floor })}</li>
            <li className={`resident-chip--${unit.status}`}>{t(unitStatusMessageKey[unit.status])}</li>
          </ul>

          <section className="resident-section" aria-labelledby="resident-unit-residents-heading">
            <h2 id="resident-unit-residents-heading" className="resident-eyebrow">{t("nav.residents")}</h2>
            {residents.length ? (
              <ul className="resident-row-list">
                {residents.map((resident) => (
                  <li key={resident.id} className="resident-card resident-row">
                    <UserCircle aria-hidden="true" weight="duotone" />
                    <span className="resident-row__copy">
                      <strong>{resident.name[locale]}</strong>
                      <small>{t(residentRoleMessageKey[resident.role])}</small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resident-card resident-empty">{t("empty.residents")}</p>
            )}
          </section>

          <section className="resident-section" aria-labelledby="resident-unit-expenses-heading">
            <div className="resident-section__heading">
              <h2 id="resident-unit-expenses-heading" className="resident-eyebrow">{t("nav.expenses")}</h2>
              <button type="button" className="resident-link-button" onClick={() => flow.replace(getResidentScreen("expenses"))}>
                {t("action.view_all")}
              </button>
            </div>
            {invoices.length ? (
              <ul className="resident-row-list">
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="resident-card resident-row">
                    <FileText aria-hidden="true" weight="duotone" />
                    <span className="resident-row__copy">
                      <strong>{invoice.title[locale]}</strong>
                      <small>{t(invoiceStatusMessageKey[invoice.status])}</small>
                    </span>
                    <b className="jeerah-numeric">{formatSar(invoice.total, locale)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resident-card resident-empty">{t("empty.expenses")}</p>
            )}
          </section>

          <section className="resident-section" aria-labelledby="resident-unit-orders-heading">
            <div className="resident-section__heading">
              <h2 id="resident-unit-orders-heading" className="resident-eyebrow">{t("nav.orders")}</h2>
              <button type="button" className="resident-link-button" onClick={() => flow.replace(getResidentScreen("orders"))}>
                {t("action.view_all")}
              </button>
            </div>
            {orders.length ? (
              <ul className="resident-row-list">
                {orders.slice(0, 3).map((order) => (
                  <li key={order.id} className="resident-card resident-row">
                    <ShoppingBag aria-hidden="true" weight="duotone" />
                    <span className="resident-row__copy">
                      <strong>{state.serviceOfferings.find((service) => service.id === order.serviceId)?.name[locale] ?? t("nav.services")}</strong>
                      <small>{t(orderStatusMessageKey[order.status])}</small>
                    </span>
                    <CaretRight aria-hidden="true" weight="bold" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resident-card resident-empty">{t("empty.orders")}</p>
            )}
          </section>
        </div>
      </div>
    </MobileScroll>
  );
}
