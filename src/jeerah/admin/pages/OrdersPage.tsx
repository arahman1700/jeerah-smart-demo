import { useState } from "react";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatSar } from "../../domain/format";
import { canTransition } from "../../domain/reducer";
import { ORDER_TRANSITIONS, type ServiceOrder } from "../../domain/models";
import { orderStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";

function OrderRow({ order }: { order: ServiceOrder }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [providerId, setProviderId] = useState("");
  const [quote, setQuote] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  const offering = state.serviceOfferings.find((item) => item.id === order.serviceId);
  const compatibleProviders = state.providers.filter((provider) => provider.serviceIds.includes(order.serviceId));
  const provider = state.providers.find((item) => item.id === order.providerId);
  const legalNextStatuses = ORDER_TRANSITIONS[order.status].filter((status) => status !== "assigned");

  return (
    <tr data-testid={`admin-order-${order.id}`}>
      <td>
        <strong>{offering ? offering.name[locale] : order.serviceId}</strong>
        <span className="admin-muted"><bdi dir="ltr">{order.id}</bdi></span>
      </td>
      <td>{t(orderStatusMessageKey[order.status])}</td>
      <td>{provider ? provider.name[locale] : "—"}</td>
      <td><bdi>{order.amount !== undefined ? formatSar(order.amount, locale) : order.quoteAmount !== undefined ? formatSar(order.quoteAmount, locale) : "—"}</bdi></td>
      <td className="admin-order-actions">
        {canTransition(order.status, "assigned") && compatibleProviders.length > 0 ? (
          <span className="admin-inline-control">
            <label className="admin-field admin-field--compact">
              <span>{t("admin.assign_provider")}</span>
              <select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                <option value="">—</option>
                {compatibleProviders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name[locale]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              disabled={!providerId}
              onClick={async () => {
                await dispatch({ type: "order/provider-assigned", orderId: order.id, providerId, occurredAt: state.now });
                announce(t("admin.saved"));
              }}
            >
              {t("action.assign")}
            </button>
          </span>
        ) : null}
        {order.status === "awaiting-quote" ? (
          <span className="admin-inline-control">
            <label className="admin-field admin-field--compact">
              <span>{t("admin.quote_amount")}</span>
              <input type="number" min="1" value={quote} onChange={(event) => setQuote(event.target.value)} />
            </label>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              disabled={!(Number(quote) > 0)}
              onClick={async () => {
                await dispatch({ type: "quote/provided", orderId: order.id, amount: Number(quote), occurredAt: state.now });
                announce(t("admin.saved"));
              }}
            >
              {t("admin.send_quote")}
            </button>
          </span>
        ) : null}
        {order.status === "quote-ready" && order.quoteAmount !== undefined ? (
          <span className="admin-inline-control">
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={async () => {
                await dispatch({ type: "quote/approved", orderId: order.id, amount: order.quoteAmount!, occurredAt: state.now });
                announce(t("admin.saved"));
              }}
            >
              {t("action.approve")}
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={async () => {
                await dispatch({ type: "quote/rejected", orderId: order.id, occurredAt: state.now });
                announce(t("admin.saved"));
              }}
            >
              {t("action.reject")}
            </button>
          </span>
        ) : null}
        {legalNextStatuses.length > 0 ? (
          <span className="admin-inline-control">
            <label className="admin-field admin-field--compact">
              <span>{t("admin.change_status")}</span>
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                <option value="">—</option>
                {legalNextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(orderStatusMessageKey[status])}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              disabled={!nextStatus}
              onClick={async () => {
                await dispatch({
                  type: "order/status-changed",
                  orderId: order.id,
                  status: nextStatus as ServiceOrder["status"],
                  occurredAt: state.now,
                });
                setNextStatus("");
                announce(t("admin.saved"));
              }}
            >
              {t("action.apply")}
            </button>
          </span>
        ) : null}
      </td>
    </tr>
  );
}

export function OrdersPage() {
  const state = useDemoState();
  const { t } = useI18n();
  const rows = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <h1>{t("nav.orders")}</h1>
      <div className="admin-table-scroll">
        <table className="admin-table" aria-label={t("nav.orders")}>
          <thead>
            <tr>
              <th scope="col">{t("table.service")}</th>
              <th scope="col">{t("table.status")}</th>
              <th scope="col">{t("table.provider")}</th>
              <th scope="col">{t("table.amount")}</th>
              <th scope="col">{t("action.manage")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
