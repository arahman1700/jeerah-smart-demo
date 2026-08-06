import { CaretRight, ShoppingBag } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { residentOrders } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { serviceFulfillmentMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage, Ltr } from "../components/ResidentPage";
import { OrderStatusPill } from "../components/ServiceBits";

/** Only the signed-in resident's own service orders, newest first. */
export function OrdersPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const orders = residentOrders(state)
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id));

  return (
    <ResidentPage screen="orders" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><ShoppingBag weight="duotone" /></span>
        <h1>{t("nav.orders")}</h1>
        <p className="resident-page-title__intro">{t("order.your_orders")}</p>
      </header>

      {orders.length ? (
        <div className="resident-row-list">
          {orders.map((order) => {
            const service = state.serviceOfferings.find((item) => item.id === order.serviceId);
            return (
              <button
                type="button"
                key={order.id}
                className="resident-card resident-row"
                data-testid={`order-row-${order.id}`}
                onClick={() => flow.push(getResidentRoute({ kind: "order", orderId: order.id }))}
              >
                <span className="resident-row__copy">
                  <strong>{service?.name[locale] ?? t("nav.services")}</strong>
                  <small>
                    {t(serviceFulfillmentMessageKey[order.fulfillment])} · {formatDate(order.createdAt, locale)}
                    {order.amount === undefined ? "" : " · "}
                    {order.amount === undefined ? null : <Ltr>{formatSar(order.amount, locale)}</Ltr>}
                  </small>
                </span>
                <OrderStatusPill status={order.status} />
                <CaretRight aria-hidden="true" weight="bold" />
              </button>
            );
          })}
        </div>
      ) : <p className="resident-card resident-empty">{t("empty.orders")}</p>}
    </ResidentPage>
  );
}
