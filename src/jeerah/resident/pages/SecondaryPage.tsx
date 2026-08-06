import { Bell, CaretRight, ClipboardText, DeviceMobile, FileText, ShoppingBag, Storefront, UserCircle } from "@phosphor-icons/react";
import { MobileScroll } from "../../../mobile/MobileScroll";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { invoiceStatusMessageKey, orderStatusMessageKey, residentRoleMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { orderedBuildingActivities } from "./HomePage";

export type SecondaryScreenId = "expenses" | "marketplace" | "orders" | "community" | "profile" | "install";

const pageMeta = {
  expenses: { titleKey: "nav.expenses", introKey: "resident.track_and_pay", icon: FileText },
  marketplace: { titleKey: "nav.marketplace", introKey: "resident.marketplace_description", icon: Storefront },
  orders: { titleKey: "nav.orders", introKey: "resident.maintenance", icon: ShoppingBag },
  community: { titleKey: "nav.community", introKey: "resident.community_intro", icon: Bell },
  profile: { titleKey: "nav.profile", introKey: "resident.profile_intro", icon: UserCircle },
  install: { titleKey: "nav.install", introKey: "install.offline", icon: DeviceMobile },
} as const;

/**
 * Root screens that Tasks 7-12 replace with their own journeys. They stay honest
 * today by listing the seeded records they own instead of faking controls.
 */
export function SecondaryPage({ id }: { id: SecondaryScreenId }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const meta = pageMeta[id];
  const Icon = meta.icon;

  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const invoices = state.invoices.filter((invoice) => invoice.residentId === state.currentResidentId);
  const orders = state.orders.filter((order) => order.residentId === state.currentResidentId);
  const activities = orderedBuildingActivities(state.activities, state.currentBuildingId);

  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className="resident-page-content resident-page-content--footer-clearance resident-page-content--padded"
        data-testid="resident-page-content"
        data-resident-screen={id}
      >
        <header className="resident-page-title">
          <span className="resident-page-title__icon" aria-hidden="true"><Icon weight="duotone" /></span>
          <h1>{t(meta.titleKey)}</h1>
          <p className="resident-page-title__intro">{t(meta.introKey)}</p>
        </header>

        {id === "expenses" ? (
          invoices.length ? (
            <ul className="resident-row-list">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="resident-card resident-row">
                  <FileText aria-hidden="true" weight="duotone" />
                  <span className="resident-row__copy">
                    <strong>{invoice.title[locale]}</strong>
                    <small>{t("resident.due_on", { date: formatDate(invoice.dueDate, locale) })} · {t(invoiceStatusMessageKey[invoice.status])}</small>
                  </span>
                  <b className="jeerah-numeric">{formatSar(invoice.total, locale)}</b>
                </li>
              ))}
            </ul>
          ) : <p className="resident-card resident-empty">{t("empty.expenses")}</p>
        ) : null}

        {id === "orders" ? (
          orders.length ? (
            <ul className="resident-row-list">
              {orders.map((order) => (
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
          ) : <p className="resident-card resident-empty">{t("empty.orders")}</p>
        ) : null}

        {id === "community" ? (
          activities.length ? (
            <ul className="resident-row-list">
              {activities.map((activity) => (
                <li key={activity.id} className="resident-card resident-row">
                  <ClipboardText aria-hidden="true" weight="duotone" />
                  <span className="resident-row__copy">
                    <strong>{activity.title[locale]}</strong>
                    <small>{activity.description[locale]}</small>
                  </span>
                  <time className="jeerah-numeric" dateTime={activity.occurredAt}>{formatDate(activity.occurredAt, locale)}</time>
                </li>
              ))}
            </ul>
          ) : <p className="resident-card resident-empty">{t("empty.community")}</p>
        ) : null}

        {id === "profile" ? (
          resident ? (
            <dl className="resident-card resident-facts">
              <div>
                <dt>{t("table.name")}</dt>
                <dd>{resident.name[locale]}</dd>
              </div>
              <div>
                <dt>{t("table.status")}</dt>
                <dd>{t(residentRoleMessageKey[resident.role])}</dd>
              </div>
            </dl>
          ) : <p className="resident-card resident-empty">{t("empty.residents")}</p>
        ) : null}

        {id === "marketplace" || id === "install" ? (
          <p className="resident-card resident-empty">{t("label.demo_only")}</p>
        ) : null}
      </div>
    </MobileScroll>
  );
}
